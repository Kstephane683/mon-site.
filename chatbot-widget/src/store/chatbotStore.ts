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
        const { addMessage, currentAgent, setTyping } = get();
        
        const userMessage: Message = {
          id: generateMessageId(),
          conversationId: 'current',
          type: 'user',
          content,
          timestamp: new Date(),
          status: 'sending',
        };

        addMessage(userMessage);

        // Simuler réponse (à remplacer par vrai appel API)
        setTyping(true);

        try {
          // Update message status
          set(state => ({
            messages: state.messages.map(msg =>
              msg.id === userMessage.id ? { ...msg, status: 'sent' } : msg
            ),
          }));

          // Simuler délai réseau
          await new Promise(resolve => setTimeout(resolve, 1500));

          // Réponse simulée (à remplacer par appel API réel)
          const botResponse = getBotResponse(content, currentAgent);

          addMessage({
            id: generateMessageId(),
            conversationId: 'current',
            type: 'bot',
            content: botResponse.content,
            agentId: currentAgent.id,
            agentName: currentAgent.displayName,
            avatar: currentAgent.avatar,
            timestamp: new Date(),
            status: 'delivered',
            quickReplies: botResponse.quickReplies,
          });
        } catch (error) {
          console.error('Error sending message:', error);
          set(state => ({
            messages: state.messages.map(msg =>
              msg.id === userMessage.id ? { ...msg, status: 'error' } : msg
            ),
          }));
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

// Fonction de réponse bot simplifiée (à remplacer par IA)
const getBotResponse = (userMessage: string, agent: Agent) => {
  // Détection de mots-clés simples
  const lowerMessage = userMessage.toLowerCase();
  
  let response = `Je comprends votre question "${userMessage}". `;
  
  if (lowerMessage.includes('prix') || lowerMessage.includes('tarif') || lowerMessage.includes('coût')) {
    response += `Nos tarifs sont adaptés à chaque projet. Je vous recommande de consulter notre page tarifs ou de demander un devis personnalisé. Voulez-vous que je vous redirige vers notre conseiller facturation?`;
  } else if (lowerMessage.includes('demo') || lowerMessage.includes('essai')) {
    response += `Excellente idée! Je peux organiser une démo personnalisée pour vous. Laissez-moi vos coordonnées et notre équipe vous contactera dans les 24h.`;
  } else if (lowerMessage.includes('lead') || lowerMessage.includes('acquisition')) {
    response += `L'acquisition de leads est notre spécialité! Nous pouvons augmenter votre génération de leads de +40% en moyenne. Voulez-vous parler à Sarah, notre experte acquisition?`;
  } else {
    response += `En tant que ${agent.displayName}, je suis là pour vous aider sur ${agent.specialties.slice(0, 3).join(', ')}. Comment puis-je vous accompagner concrètement?`;
  }

  return {
    content: response,
    quickReplies: agent.quickReplies,
  };
};
