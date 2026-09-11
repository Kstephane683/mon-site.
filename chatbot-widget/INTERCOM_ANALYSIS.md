# Analyse Détaillée du Chatbot Intercom
## Document de Spécifications pour ePerformance

**Date d'analyse**: 11 septembre 2026  
**Objectif**: Reproduire l'excellence UX/UI d'Intercom pour le chatbot ePerformance

---

## 1. VISUAL DESIGN

### 1.1 Palette de Couleurs

**Couleurs principales observées:**
- **Primary Blue**: `#1F8DED` - Couleur de marque Intercom, utilisée pour le bouton launcher et les éléments d'action
- **Deep Blue**: `#0747A6` - Variante plus foncée pour les hover states
- **White**: `#FFFFFF` - Background principal du widget
- **Light Gray**: `#F7F8FA` - Background des messages de l'utilisateur
- **Dark Text**: `#1F1F1F` - Texte principal
- **Secondary Text**: `#6B7280` - Texte secondaire, timestamps
- **Border Color**: `#E5E7EB` - Bordures subtiles
- **Success Green**: `#00B87C` - Indicateurs de statut positif
- **Gradient Overlay**: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)` - Pour les headers premium

### 1.2 Typographie

**Font Stack:**
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', 
             Helvetica, Arial, sans-serif;
```

**Tailles et Weights:**
- **Titre du widget**: 16px, font-weight: 600
- **Message d'accueil**: 15px, font-weight: 400, line-height: 1.5
- **Boutons d'action**: 14px, font-weight: 500
- **Texte des messages**: 15px, font-weight: 400
- **Timestamps**: 12px, font-weight: 400
- **Nom de l'agent**: 14px, font-weight: 600

### 1.3 Espacements et Layout

**Widget Dimensions:**
```css
/* Launcher Button */
width: 60px;
height: 60px;
border-radius: 50%;
bottom: 20px;
right: 20px;

/* Chat Window (Desktop) */
width: 400px;
max-height: 704px;
border-radius: 16px;
bottom: 90px;
right: 20px;

/* Chat Window (Mobile) */
width: 100vw;
height: 100vh;
border-radius: 0;
```

**Paddings internes:**
```css
/* Header */
padding: 20px 20px 16px 20px;

/* Message Bubble */
padding: 12px 16px;
margin-bottom: 8px;

/* Input Area */
padding: 16px 20px 20px 20px;

/* Button */
padding: 12px 20px;
```

### 1.4 Border-radius et Ombres

**Border Radius:**
```css
/* Widget Container */
border-radius: 16px;

/* Message Bubbles (Bot) */
border-radius: 16px 16px 16px 4px;

/* Message Bubbles (User) */
border-radius: 16px 16px 4px 16px;

/* Buttons */
border-radius: 8px;

/* Input Field */
border-radius: 24px;
```

**Ombres (Box Shadows):**
```css
/* Widget Container */
box-shadow: 0 12px 48px rgba(0, 0, 0, 0.12), 
            0 4px 16px rgba(0, 0, 0, 0.08);

/* Launcher Button */
box-shadow: 0 4px 16px rgba(31, 141, 237, 0.32),
            0 2px 8px rgba(0, 0, 0, 0.12);

/* Message Hover */
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
```

### 1.5 Animations

**Timing Functions:**
```css
/* Transition principale */
transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);

/* Bounce effect (launcher pulse) */
animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;

/* Slide in (widget appearance) */
animation: slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);

/* Fade in (messages) */
animation: fadeIn 0.3s ease-out;
```

**Animations clés:**
```css
@keyframes slideInUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 4px 16px rgba(31, 141, 237, 0.32);
  }
  50% {
    box-shadow: 0 4px 24px rgba(31, 141, 237, 0.48);
  }
}

/* Typing indicator */
@keyframes typing {
  0%, 60%, 100% { opacity: 0.3; }
  30% { opacity: 1; }
}
```

---

## 2. MESSAGE D'ACCUEIL

### 2.1 Structure Exacte

**Layout observé:**
```
[Avatar de l'agent] [Badge "We reply immediately"]
"👋 Hi there"
"Welcome to Intercom. Have a question? We're here to help."

[Button: 💬 Chat with us]
[Button: 📚 Search for help]
```

### 2.2 Texte Utilisé (Exemples Intercom)

**Variations de messages d'accueil:**
1. "👋 Hi there! Welcome to [Company]. How can we help you today?"
2. "Hey! 👋 Need help with something? We're here for you."
3. "Welcome! We typically reply in a few minutes."
4. "Hi! Looking for help? Let us know what you need."

**Appels à l'action:**
- "Chat with us" (primary)
- "Search for help" (secondary)
- "See our help center"
- "Get started"

### 2.3 Boutons d'Action Proposés

**Structure des boutons:**
```jsx
<Button variant="primary">
  <Icon>💬</Icon>
  <Text>Chat with us</Text>
</Button>

<Button variant="secondary">
  <Icon>📚</Icon>
  <Text>Search for help</Text>
</Button>
```

**Styles:**
```css
/* Primary Button */
background: #1F8DED;
color: #FFFFFF;
border: none;
padding: 12px 20px;
border-radius: 8px;
font-weight: 500;
cursor: pointer;
transition: background 0.2s;

&:hover {
  background: #0D7FDB;
}

/* Secondary Button */
background: transparent;
color: #1F8DED;
border: 2px solid #E5E7EB;
padding: 12px 20px;
border-radius: 8px;
font-weight: 500;

&:hover {
  border-color: #1F8DED;
  background: #F0F8FF;
}
```

### 2.4 Tone of Voice

**Caractéristiques:**
- **Amical et accueillant**: Utilisation d'emojis (👋, 💬, 📚)
- **Concis**: Messages courts et directs
- **Rassurant**: "We're here to help", "We reply immediately"
- **Proactif**: Propose des options claires
- **Professionnel mais décontracté**: Tutoiement naturel en anglais

**Principes pour ePerformance:**
- Utiliser le français professionnel mais accessible
- Emoji subtil pour humaniser (🎯, 💪, 📊)
- Rassurer sur la rapidité et la qualité du service
- Proposer des chemins clairs vers l'aide

---

## 3. DÉCLENCHEURS (TRIGGERS)

### 3.1 Déclencheurs Temporels

**Timing observé:**
```javascript
// Apparition du launcher
onPageLoad: 'immediate' // Le bouton apparaît immédiatement

// Premier message proactif
delay: 15000 // 15 secondes après l'arrivée sur la page

// Message de réengagement
delay: 45000 // 45 secondes si pas d'interaction

// Exit intent
onMouseLeave: { threshold: 'top-50px' }
```

### 3.2 Déclencheurs Comportementaux

**Patterns détectés:**
1. **Scroll depth**: Message après 50% de scroll sur page clé
2. **Time on page**: Notification après 30s sur page pricing
3. **Repeat visitor**: Message personnalisé pour visiteurs récurrents
4. **Idle detection**: "Still looking for something?" après 2min d'inactivité
5. **Cart abandonment**: (e-commerce) Rappel si panier non finalisé

### 3.3 Déclencheurs Contextuels

**Par page:**
```javascript
const triggers = {
  '/': {
    message: "Bienvenue sur ePerformance! Comment puis-je vous aider?",
    delay: 10000
  },
  '/pricing': {
    message: "Des questions sur nos tarifs? Je suis là pour vous aider.",
    delay: 5000
  },
  '/features': {
    message: "Besoin de détails sur nos fonctionnalités?",
    delay: 15000
  },
  '/contact': {
    message: "Je peux répondre à vos questions immédiatement!",
    delay: 0
  }
}
```

### 3.4 Messages Proactifs

**Exemples de messages contextuels:**
- Homepage: "👋 Besoin d'aide pour démarrer?"
- Pricing: "💰 Questions sur nos offres?"
- Features: "🎯 Laissez-moi vous guider"
- Blog: "📚 Besoin de plus d'informations?"
- 404: "😕 Perdu? Je peux vous aider à trouver ce que vous cherchez"

---

## 4. FLOW CONVERSATIONNEL

### 4.1 Options de Navigation

**Structure arborescente:**
```
Message d'accueil
├── 💬 Parler à un agent
│   ├── Sélection du type de demande
│   │   ├── 💼 Question commerciale
│   │   ├── 🔧 Support technique
│   │   ├── 📊 Démonstration produit
│   │   └── 💳 Facturation
│   └── Formulaire de contact rapide
├── 📚 Centre d'aide
│   ├── 🔍 Recherche
│   ├── 📝 Articles populaires
│   └── 🎥 Tutoriels vidéo
└── 🤖 Assistant IA
    ├── Questions fréquentes
    ├── Calculateur de ROI
    └── Recommandations personnalisées
```

### 4.2 Quick Replies

**Format des réponses rapides:**
```jsx
<QuickReply>
  <Chip onClick={handleClick}>🏋️ Gestion de salle</Chip>
  <Chip onClick={handleClick}>👥 Gestion des membres</Chip>
  <Chip onClick={handleClick}>💳 Paiements</Chip>
  <Chip onClick={handleClick}>📊 Statistiques</Chip>
  <Chip onClick={handleClick}>🎯 Autre chose</Chip>
</QuickReply>
```

**Styles des chips:**
```css
.quick-reply-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  margin: 4px;
  background: #F7F8FA;
  border: 1px solid #E5E7EB;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.quick-reply-chip:hover {
  background: #FFFFFF;
  border-color: #1F8DED;
  color: #1F8DED;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(31, 141, 237, 0.15);
}
```

### 4.3 Suggestions Intelligentes

**Types de suggestions:**
1. **Basées sur le contexte**: "Vu que vous êtes sur la page [X], vous pourriez être intéressé par..."
2. **Basées sur l'historique**: "La dernière fois, vous avez demandé [Y], voulez-vous continuer?"
3. **Populaires**: "Les autres utilisateurs demandent souvent..."
4. **Saisonnières**: "En ce moment, nos clients s'intéressent à..."

**Affichage:**
```jsx
<SuggestionCard>
  <Icon>💡</Icon>
  <Title>Suggestion</Title>
  <Text>Découvrez comment [Feature] peut vous aider</Text>
  <Link>En savoir plus →</Link>
</SuggestionCard>
```

---

## 5. PERSONNALISATION

### 5.1 Avatar / Logo

**Spécifications techniques:**
```css
.agent-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #FFFFFF;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}

/* Position dans le header */
.chat-header {
  display: flex;
  align-items: center;
  gap: 12px;
}
```

**Recommandations pour ePerformance:**
- Utiliser le logo ePerformance (violet gradient) comme avatar principal
- Pour les agents spécialisés: Icônes thématiques (💪 Fitness, 📊 Analytics, 💳 Billing)
- Format: PNG ou SVG, 80x80px minimum
- Background: Transparent ou violet gradient de la marque

### 5.2 Nom de l'Agent

**Structure:**
```jsx
<AgentInfo>
  <Avatar src="/logo-ep.png" alt="ePerformance" />
  <Details>
    <Name>Agent ePerformance</Name>
    <Status>
      <Indicator color="green" />
      <Text>En ligne · Répond en quelques minutes</Text>
    </Status>
  </Details>
</AgentInfo>
```

**Noms suggérés pour les 27 agents ePerformance:**
1. Agent Accueil (général)
2. Expert Fitness (programmes d'entraînement)
3. Conseiller Nutrition
4. Spécialiste Équipement
5. Coach Gestion (business)
6. Analyste Performance (stats)
7. Support Technique
8. Conseiller Facturation
9. Expert Marketing
10. Formateur (tutoriels)
... (etc.)

### 5.3 Messages Personnalisés

**Patterns de personnalisation:**
```javascript
// Utilisateur connu
const welcomeMessage = `Bonjour ${user.firstName}! Content de vous revoir 👋`;

// Première visite
const welcomeMessage = `Bienvenue sur ePerformance! 🎯`;

// Visite récurrente
const welcomeMessage = `Bonjour! Besoin d'aide avec ${lastTopic}?`;

// Contexte spécifique
const welcomeMessage = `Je vois que vous regardez ${currentPage}, 
                       puis-je vous aider?`;
```

### 5.4 Context Awareness

**Données contextuelles à tracker:**
```typescript
interface UserContext {
  // Navigation
  currentPage: string;
  previousPages: string[];
  timeOnPage: number;
  scrollDepth: number;
  
  // Profil
  isAuthenticated: boolean;
  userType: 'free' | 'premium' | 'enterprise';
  firstName?: string;
  
  // Historique
  previousConversations: Conversation[];
  lastInteraction?: Date;
  commonTopics: string[];
  
  // Comportement
  isReturningVisitor: boolean;
  visitCount: number;
  hasCompletedAction: boolean;
}
```

**Utilisation:**
```javascript
// Adapter le message selon le contexte
if (userContext.isAuthenticated) {
  showPersonalizedGreeting();
} else if (userContext.visitCount > 3) {
  showReturningVisitorMessage();
} else {
  showNewVisitorMessage();
}
```

---

## 6. CODE REACT COMPONENTS

### 6.1 Structure de Composants Recommandée

```
src/components/chatbot/
├── ChatbotWidget.tsx          # Container principal
├── ChatbotLauncher.tsx        # Bouton flottant
├── ChatbotWindow.tsx          # Fenêtre de chat
├── ChatbotHeader.tsx          # Header avec avatar/nom
├── ChatbotMessages.tsx        # Liste des messages
├── ChatbotMessage.tsx         # Message individuel
├── ChatbotInput.tsx           # Zone de saisie
├── QuickReplies.tsx           # Boutons de réponse rapide
├── TypingIndicator.tsx        # Animation "typing..."
├── AgentCard.tsx              # Carte d'agent
└── hooks/
    ├── useChatbot.ts          # Logic principal
    ├── useMessages.ts         # Gestion des messages
    ├── useTriggers.ts         # Système de triggers
    └── useContext.ts          # Context utilisateur
```

### 6.2 Props Nécessaires

**ChatbotWidget.tsx:**
```typescript
interface ChatbotWidgetProps {
  // Configuration
  config: {
    position?: 'bottom-right' | 'bottom-left';
    primaryColor?: string;
    companyName: string;
    companyLogo: string;
  };
  
  // Agents
  agents: Agent[];
  defaultAgent?: string;
  
  // Comportement
  triggers?: TriggerConfig[];
  autoOpen?: boolean;
  proactiveMessages?: boolean;
  
  // Callbacks
  onConversationStart?: () => void;
  onMessageSent?: (message: Message) => void;
  onAgentSelected?: (agentId: string) => void;
  
  // Contexte utilisateur
  userContext?: UserContext;
}
```

**Message.tsx:**
```typescript
interface MessageProps {
  id: string;
  type: 'user' | 'bot' | 'system';
  content: string;
  timestamp: Date;
  avatar?: string;
  agentName?: string;
  isTyping?: boolean;
  quickReplies?: QuickReply[];
}
```

### 6.3 State Management

**Exemple avec Context API:**
```typescript
// ChatbotContext.tsx
interface ChatbotState {
  isOpen: boolean;
  messages: Message[];
  currentAgent: Agent | null;
  isTyping: boolean;
  userContext: UserContext;
}

interface ChatbotActions {
  openChat: () => void;
  closeChat: () => void;
  sendMessage: (content: string) => void;
  selectAgent: (agentId: string) => void;
  addMessage: (message: Message) => void;
}

const ChatbotContext = createContext<{
  state: ChatbotState;
  actions: ChatbotActions;
} | null>(null);

export const ChatbotProvider: React.FC = ({ children }) => {
  const [state, setState] = useState<ChatbotState>(initialState);
  
  const actions: ChatbotActions = {
    openChat: () => setState(prev => ({ ...prev, isOpen: true })),
    closeChat: () => setState(prev => ({ ...prev, isOpen: false })),
    // ... autres actions
  };
  
  return (
    <ChatbotContext.Provider value={{ state, actions }}>
      {children}
    </ChatbotContext.Provider>
  );
};
```

### 6.4 Exemple de Composant Complet

**ChatbotLauncher.tsx:**
```typescript
import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { useChatbot } from './hooks/useChatbot';

export const ChatbotLauncher: React.FC = () => {
  const { state, actions } = useChatbot();
  const [showBadge, setShowBadge] = useState(true);
  
  return (
    <motion.button
      className="chatbot-launcher"
      onClick={actions.openChat}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      animate={{
        boxShadow: [
          '0 4px 16px rgba(139, 92, 246, 0.32)',
          '0 4px 24px rgba(139, 92, 246, 0.48)',
          '0 4px 16px rgba(139, 92, 246, 0.32)',
        ],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {showBadge && (
        <motion.div
          className="notification-badge"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
        >
          1
        </motion.div>
      )}
      <MessageCircle size={28} color="white" />
    </motion.button>
  );
};
```

**Styles (Tailwind + CSS):**
```css
.chatbot-launcher {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.notification-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #ef4444;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  border: 2px solid white;
}
```

---

## 7. INTERACTIONS ET MICRO-ANIMATIONS

### 7.1 Animations d'Entrée

```typescript
// Variants pour Framer Motion
const windowVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    y: 20,
    scale: 0.95,
    transition: {
      duration: 0.2,
    },
  },
};

const messageVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
};
```

### 7.2 Typing Indicator

```typescript
const TypingIndicator: React.FC = () => (
  <div className="typing-indicator">
    <span></span>
    <span></span>
    <span></span>
  </div>
);

// CSS
.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 12px 16px;
  background: #F7F8FA;
  border-radius: 16px 16px 16px 4px;
  width: fit-content;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: #9CA3AF;
  border-radius: 50%;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}
```

### 7.3 Scroll Behavior

```typescript
// Auto-scroll vers le bas
const scrollToBottom = () => {
  messagesEndRef.current?.scrollIntoView({
    behavior: 'smooth',
    block: 'end',
  });
};

useEffect(() => {
  scrollToBottom();
}, [messages]);
```

---

## 8. RESPONSIVE DESIGN

### 8.1 Breakpoints

```css
/* Mobile first approach */
.chatbot-window {
  /* Mobile (default) */
  width: 100vw;
  height: 100vh;
  border-radius: 0;
  bottom: 0;
  right: 0;
}

@media (min-width: 640px) {
  /* Tablet */
  .chatbot-window {
    width: 380px;
    max-height: 600px;
    border-radius: 16px;
    bottom: 90px;
    right: 20px;
  }
}

@media (min-width: 1024px) {
  /* Desktop */
  .chatbot-window {
    width: 400px;
    max-height: 704px;
  }
}
```

### 8.2 Touch Optimizations

```css
/* Zones de touch plus grandes sur mobile */
@media (max-width: 640px) {
  .quick-reply-chip {
    min-height: 44px; /* Recommandation Apple */
    padding: 12px 20px;
  }
  
  .chatbot-launcher {
    width: 56px;
    height: 56px;
    bottom: 16px;
    right: 16px;
  }
}
```

---

## CONCLUSION

Cette analyse détaille tous les aspects visuels et fonctionnels du chatbot Intercom. Les sections suivantes décriront comment adapter ces principes au contexte spécifique d'ePerformance avec ses 27 agents spécialisés et son branding violet gradient.

**Points clés à retenir:**
1. Design minimaliste et épuré
2. Animations fluides et naturelles
3. Personnalisation contextuelle
4. Messages proactifs intelligents
5. Quick replies pour accélérer les conversations
6. Responsive et accessible
7. Performance optimale (lazy loading, code splitting)

**Prochaine étape:** Plan d'implémentation pour ePerformance
