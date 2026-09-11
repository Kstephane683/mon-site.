// store/chatbotStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Agent, Message, UserContext } from '../types';
import { DEFAULT_AGENT } from '../data/agents';
import { generateUserId, generateSessionId, generateMessageId, detectDevice, detectBrowser } from '../utils/helpers';
import { storage } from '../utils/storage';

interface ChatbotState {
  isOpen: boolean;
  isMinimized: boolean;
  hasInteracted: boolean;
  currentAgent: Agent;
  messages: Message[];
  isTyping: boolean;
  userContext: UserContext;
}

interface ChatbotActions {
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  minimizeChat: () => void;
  switchAgent: (agentId: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  addMessage: (message: Message) => void;
  setTyping: (isTyping: boolean) => void;
  updateContext: (context: Partial<UserContext>) => void;
}

export const useChatbotStore = create<ChatbotState & ChatbotActions>()(
  persist(
    (set, get) => ({
      // State initial
      isOpen: false,
      isMinimized: false,
      hasInteracted: false,
      currentAgent: DEFAULT_AGENT,
      messages: [],
      isTyping: false,
      userContext: {
        userId: generateUserId(),
        sessionId: generateSessionId(),
        isAuthenticated: false,
        currentPage: window.location.pathname,
        previousPages: [],
        referrer: document.referrer,
        timeOnPage: 0,
        scrollDepth: 0,
        isReturningVisitor: storage.get('hasVisited') === true,
        visitCount: (storage.get('visitCount') as number) || 1,
        firstVisit: new Date(storage.get('firstVisit') as string || Date.now()),
        previousConversations: [],
        commonTopics: [],
        device: detectDevice(),
        browser: detectBrowser(),
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        hasTrialStarted: false,
        hasPurchased: false,
      },

      // Actions
      openChat: () => {
        set({ isOpen: true, isMinimized: false, hasInteracted: true });
        
        const { messages, currentAgent, addMessage } = get();
        
        // Envoyer message d'accueil si premier message
        if (messages.length === 0) {
          addMessage({
            id: generateMessageId(),
            conversationId: 'current',
            type: 'bot',
            content: currentAgent.greeting,
            agentId: currentAgent.id,
            agentName: currentAgent.displayName,
            avatar: currentAgent.avatar,
            timestamp: new Date(),
            status: 'delivered',
            quickReplies: currentAgent.quickReplies,
          });
        }
      },

      closeChat: () => set({ isOpen: false }),

      toggleChat: () => {
        const { isOpen, openChat, closeChat } = get();
        if (isOpen) {
          closeChat();
        } else {
          openChat();
        }
      },

      minimizeChat: () => set({ isMinimized: true, isOpen: false }),

      switchAgent: async (agentId: string) => {
        const { AGENTS } = await import('../data/agents');
        const agent = AGENTS.find(a => a.id === agentId);
        if (!agent) return;

        set({ currentAgent: agent });

        const { addMessage } = get();

        // Message de transition
        addMessage({
          id: generateMessageId(),
          conversationId: 'current',
          type: 'system',
          content: `Vous êtes maintenant en contact avec ${agent.displayName}`,
          timestamp: new Date(),
          status: 'delivered',
        });

        // Message d'accueil du nouvel agent
        await new Promise(resolve => setTimeout(resolve, 500));
        addMessage({
          id: generateMessageId(),
          conversationId: 'current',
          type: 'bot',
          content: agent.greeting,
          agentId: agent.id,
          agentName: agent.displayName,
          avatar: agent.avatar,
          timestamp: new Date(),
          status: 'delivered',
          quickReplies: agent.quickReplies,
        });
      },

      sendMessage: async (content: string) => {
        const { addMessage, currentAgent, setTyping, messages, userContext } = get();
        
        const userMessage: Message = {
          id: generateMessageId(),
          conversationId: userContext.sessionId,
          type: 'user',
          content,
          timestamp: new Date(),
          status: 'sending',
        };

        addMessage(userMessage);
        setTyping(true);

        try {
          // Update message status to sent
          set(state => ({
            messages: state.messages.map(msg =>
              msg.id === userMessage.id ? { ...msg, status: 'sent' } : msg
            ),
          }));

          // Construire l'historique au format backend
          const messageHistory = messages.map(msg => ({
            role: msg.type === 'user' ? 'user' : 'ai',
            text: msg.content,
          }));

          // Ajouter le message actuel
          messageHistory.push({
            role: 'user',
            text: content,
          });

          // Appel API Railway backend
          const API_URL = 'https://web-production-4ab53.up.railway.app/api/chatbot/message';
          
          const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messages: messageHistory,
              site_id: 'eperformance_vitrine',
              conversation_id: userContext.sessionId,
              visitor_info: {
                user_agent: navigator.userAgent,
                referrer: userContext.referrer,
                current_page: userContext.currentPage,
                device: userContext.device,
                browser: userContext.browser,
                language: userContext.language,
                timezone: userContext.timezone,
              },
            }),
          });

          if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
          }

          const data = await response.json();

          // Extraire la réponse (text ou html)
          const botContent = data.html || data.text || 'Désolé, je n\'ai pas pu générer de réponse.';

          // Ajouter le message du bot
          addMessage({
            id: generateMessageId(),
            conversationId: userContext.sessionId,
            type: 'bot',
            content: botContent,
            agentId: currentAgent.id,
            agentName: currentAgent.displayName,
            avatar: currentAgent.avatar,
            timestamp: new Date(),
            status: 'delivered',
            quickReplies: data.metadata?.suggestions || [],
          });

        } catch (error) {
          console.error('Error sending message:', error);
          
          // Message status error
          set(state => ({
            messages: state.messages.map(msg =>
              msg.id === userMessage.id ? { ...msg, status: 'error' } : msg
            ),
          }));

          // Message d'erreur pour l'utilisateur
          addMessage({
            id: generateMessageId(),
            conversationId: userContext.sessionId,
            type: 'bot',
            content: '⚠️ Désolé, une erreur est survenue. Veuillez réessayer.',
            agentId: currentAgent.id,
            agentName: currentAgent.displayName,
            avatar: currentAgent.avatar,
            timestamp: new Date(),
            status: 'delivered',
          });
        } finally {
          setTyping(false);
        }
      },

      addMessage: (message: Message) => {
        set(state => ({
          messages: [...state.messages, message],
        }));
      },

      setTyping: (isTyping: boolean) => set({ isTyping }),

      updateContext: (context: Partial<UserContext>) => {
        set(state => ({
          userContext: { ...state.userContext, ...context },
        }));
      },
    }),
    {
      name: 'eperformance-chatbot-storage',
      partialize: (state) => ({
        messages: state.messages,
        hasInteracted: state.hasInteracted,
        userContext: state.userContext,
      }),
    }
  )
);
