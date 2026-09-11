# Plan d'Implémentation - Chatbot ePerformance
## De l'Excellence Intercom à ePerformance

**Date**: 11 septembre 2026  
**Objectif**: Créer un chatbot de niveau world-class pour ePerformance  
**Base**: Analyse Intercom + 27 agents spécialisés + Branding violet

---

## 🎯 VISION DU PROJET

Créer un chatbot intelligent multi-agents qui combine:
- L'excellence UX/UI d'Intercom
- Les 27 agents spécialisés ePerformance
- Le branding violet gradient unique
- Une intelligence conversationnelle avancée
- Une personnalisation contextuelle poussée

---

## 📋 TABLE DES MATIÈRES

1. [Architecture Technique](#1-architecture-technique)
2. [Phase 1: Fondations](#2-phase-1-fondations)
3. [Phase 2: Design System](#3-phase-2-design-system)
4. [Phase 3: Composants UI](#4-phase-3-composants-ui)
5. [Phase 4: Système Multi-Agents](#5-phase-4-système-multi-agents)
6. [Phase 5: Intelligence & Triggers](#6-phase-5-intelligence--triggers)
7. [Phase 6: Intégrations](#7-phase-6-intégrations)
8. [Phase 7: Tests & Optimisation](#8-phase-7-tests--optimisation)
9. [Timeline & Priorités](#9-timeline--priorités)

---

## 1. ARCHITECTURE TECHNIQUE

### 1.1 Stack Technologique

```typescript
// Frontend
- React 18+ (avec TypeScript)
- Tailwind CSS (styling utilitaire)
- Framer Motion (animations)
- Zustand ou Context API (state management)
- React Query (data fetching)
- Socket.io-client (temps réel)

// Backend
- Node.js + Express ou Next.js API Routes
- Socket.io (WebSocket pour chat temps réel)
- PostgreSQL (stockage conversations)
- Redis (cache + sessions)
- OpenAI API ou Anthropic (IA conversationnelle)

// Infrastructure
- Vercel ou Netlify (frontend hosting)
- Railway ou Render (backend hosting)
- Cloudflare (CDN + DDoS protection)
```

### 1.2 Structure de Fichiers

```
site-eperformance/
├── chatbot-widget/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Chatbot/
│   │   │   │   ├── ChatbotWidget.tsx
│   │   │   │   ├── ChatbotLauncher.tsx
│   │   │   │   ├── ChatbotWindow.tsx
│   │   │   │   ├── ChatbotHeader.tsx
│   │   │   │   ├── ChatbotMessages.tsx
│   │   │   │   ├── ChatbotMessage.tsx
│   │   │   │   ├── ChatbotInput.tsx
│   │   │   │   ├── QuickReplies.tsx
│   │   │   │   ├── TypingIndicator.tsx
│   │   │   │   ├── AgentSelector.tsx
│   │   │   │   ├── AgentCard.tsx
│   │   │   │   └── index.ts
│   │   │   └── ui/
│   │   │       ├── Button.tsx
│   │   │       ├── Avatar.tsx
│   │   │       ├── Badge.tsx
│   │   │       └── Card.tsx
│   │   ├── hooks/
│   │   │   ├── useChatbot.ts
│   │   │   ├── useMessages.ts
│   │   │   ├── useAgents.ts
│   │   │   ├── useTriggers.ts
│   │   │   ├── useContext.ts
│   │   │   └── useWebSocket.ts
│   │   ├── store/
│   │   │   ├── chatbotStore.ts
│   │   │   └── userContextStore.ts
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   ├── websocket.ts
│   │   │   └── analytics.ts
│   │   ├── data/
│   │   │   ├── agents.ts (27 agents config)
│   │   │   ├── triggers.ts
│   │   │   └── messages.ts
│   │   ├── utils/
│   │   │   ├── formatting.ts
│   │   │   ├── validation.ts
│   │   │   └── storage.ts
│   │   ├── types/
│   │   │   ├── agent.types.ts
│   │   │   ├── message.types.ts
│   │   │   └── context.types.ts
│   │   └── styles/
│   │       ├── globals.css
│   │       └── animations.css
│   ├── public/
│   │   ├── agents/
│   │   │   ├── agent-accueil.svg
│   │   │   ├── agent-fitness.svg
│   │   │   └── ... (27 agents)
│   │   └── sounds/
│   │       ├── notification.mp3
│   │       └── message-sent.mp3
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── vite.config.ts (ou next.config.js)
```

### 1.3 Types TypeScript de Base

```typescript
// types/agent.types.ts
export interface Agent {
  id: string;
  name: string;
  displayName: string;
  emoji: string;
  avatar: string;
  color: string;
  description: string;
  specialties: string[];
  greeting: string;
  quickReplies: QuickReply[];
  isAvailable: boolean;
  responseTime: string; // "En quelques secondes"
}

export interface QuickReply {
  id: string;
  text: string;
  emoji?: string;
  action: QuickReplyAction;
}

export type QuickReplyAction = 
  | { type: 'message'; payload: string }
  | { type: 'agent_switch'; payload: string }
  | { type: 'external_link'; payload: string }
  | { type: 'form'; payload: FormConfig };

// types/message.types.ts
export interface Message {
  id: string;
  conversationId: string;
  type: 'user' | 'bot' | 'system';
  content: string;
  agentId?: string;
  agentName?: string;
  avatar?: string;
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
  quickReplies?: QuickReply[];
  attachments?: Attachment[];
  metadata?: Record<string, any>;
}

export interface Conversation {
  id: string;
  userId: string;
  agentId: string;
  messages: Message[];
  status: 'active' | 'resolved' | 'waiting';
  startedAt: Date;
  lastActivity: Date;
  tags: string[];
  rating?: number;
  feedback?: string;
}

// types/context.types.ts
export interface UserContext {
  // Identité
  userId: string;
  sessionId: string;
  isAuthenticated: boolean;
  userType?: 'free' | 'premium' | 'enterprise';
  firstName?: string;
  email?: string;
  
  // Navigation
  currentPage: string;
  previousPages: string[];
  referrer?: string;
  timeOnPage: number;
  scrollDepth: number;
  
  // Comportement
  isReturningVisitor: boolean;
  visitCount: number;
  firstVisit: Date;
  lastVisit?: Date;
  
  // Historique chat
  previousConversations: string[]; // conversation IDs
  lastInteraction?: Date;
  commonTopics: string[];
  preferredAgent?: string;
  
  // Technique
  device: 'mobile' | 'tablet' | 'desktop';
  browser: string;
  language: string;
  timezone: string;
  
  // Business
  hasTrialStarted: boolean;
  hasPurchased: boolean;
  lifetimeValue?: number;
}

export interface TriggerConfig {
  id: string;
  name: string;
  enabled: boolean;
  conditions: TriggerCondition[];
  action: TriggerAction;
  priority: number;
  cooldown?: number; // ms avant de re-trigger
}

export interface TriggerCondition {
  type: 'time_on_page' | 'scroll_depth' | 'exit_intent' | 'page_match' | 'user_type' | 'custom';
  operator: 'gt' | 'lt' | 'eq' | 'contains' | 'matches';
  value: any;
}

export interface TriggerAction {
  type: 'show_message' | 'open_chat' | 'suggest_agent' | 'custom';
  payload: any;
}
```

---

## 2. PHASE 1: FONDATIONS

### 2.1 Setup Initial (Jour 1)

**Étapes:**
1. Créer le projet React + TypeScript + Vite
2. Installer les dépendances
3. Configurer Tailwind CSS
4. Setup ESLint + Prettier
5. Créer la structure de dossiers

**Commandes:**
```bash
cd /home/ballo/OX6A/site-eperformance/chatbot-widget

# Créer le projet
npm create vite@latest . -- --template react-ts

# Installer dépendances
npm install framer-motion zustand socket.io-client react-query lucide-react
npm install -D tailwindcss postcss autoprefixer
npm install -D @types/node

# Setup Tailwind
npx tailwindcss init -p

# Dev dependencies
npm install -D eslint prettier eslint-config-prettier
```

**Configuration Tailwind (tailwind.config.js):**
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ePerformance Branding
        ep: {
          violet: {
            50: '#faf5ff',
            100: '#f3e8ff',
            200: '#e9d5ff',
            300: '#d8b4fe',
            400: '#c084fc',
            500: '#a855f7', // Primary
            600: '#9333ea',
            700: '#7e22ce',
            800: '#6b21a8',
            900: '#581c87',
          },
          purple: {
            500: '#8b5cf6',
            600: '#7c3aed',
          },
        },
      },
      boxShadow: {
        'ep': '0 12px 48px rgba(168, 85, 247, 0.15), 0 4px 16px rgba(0, 0, 0, 0.08)',
        'ep-lg': '0 20px 64px rgba(168, 85, 247, 0.2), 0 8px 24px rgba(0, 0, 0, 0.1)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slideInUp': 'slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'fadeIn': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        slideInUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
```

### 2.2 Configuration des 27 Agents (Jour 2)

**Fichier: src/data/agents.ts**
```typescript
import { Agent } from '../types/agent.types';

export const AGENTS: Agent[] = [
  // 1. Agent Accueil - Point d'entrée principal
  {
    id: 'agent-accueil',
    name: 'Agent Accueil',
    displayName: 'ePerformance',
    emoji: '👋',
    avatar: '/agents/agent-accueil.svg',
    color: '#a855f7',
    description: 'Votre premier contact avec ePerformance',
    specialties: ['orientation', 'questions générales', 'redirection'],
    greeting: '👋 Bonjour! Bienvenue sur ePerformance. Comment puis-je vous aider aujourd\'hui?',
    quickReplies: [
      { id: 'qr-1', text: 'Découvrir ePerformance', emoji: '🎯', action: { type: 'message', payload: 'Parlez-moi d\'ePerformance' } },
      { id: 'qr-2', text: 'Voir les tarifs', emoji: '💰', action: { type: 'external_link', payload: '/pricing' } },
      { id: 'qr-3', text: 'Démo gratuite', emoji: '🚀', action: { type: 'form', payload: { formId: 'demo-request' } } },
      { id: 'qr-4', text: 'Support technique', emoji: '🔧', action: { type: 'agent_switch', payload: 'agent-support' } },
    ],
    isAvailable: true,
    responseTime: 'En quelques secondes',
  },

  // 2. Expert Fitness - Programmes d'entraînement
  {
    id: 'agent-fitness',
    name: 'Expert Fitness',
    displayName: 'Coach Alex',
    emoji: '💪',
    avatar: '/agents/agent-fitness.svg',
    color: '#ef4444',
    description: 'Spécialiste des programmes d\'entraînement et coaching',
    specialties: ['programmes', 'exercices', 'coaching', 'performance'],
    greeting: '💪 Salut! Je suis Alex, votre coach fitness. Parlons de vos objectifs d\'entraînement!',
    quickReplies: [
      { id: 'qr-f1', text: 'Créer un programme', emoji: '📋', action: { type: 'message', payload: 'Comment créer un programme?' } },
      { id: 'qr-f2', text: 'Suivi des performances', emoji: '📊', action: { type: 'message', payload: 'Suivi performances' } },
      { id: 'qr-f3', text: 'Bibliothèque d\'exercices', emoji: '🏋️', action: { type: 'external_link', payload: '/exercises' } },
    ],
    isAvailable: true,
    responseTime: 'En quelques secondes',
  },

  // 3. Conseiller Nutrition
  {
    id: 'agent-nutrition',
    name: 'Conseiller Nutrition',
    displayName: 'Nutritionniste Sophie',
    emoji: '🥗',
    avatar: '/agents/agent-nutrition.svg',
    color: '#10b981',
    description: 'Expert en nutrition sportive et plans alimentaires',
    specialties: ['nutrition', 'régimes', 'compléments', 'hydratation'],
    greeting: '🥗 Bonjour! Je suis Sophie, nutritionniste. Optimisons votre alimentation ensemble!',
    quickReplies: [
      { id: 'qr-n1', text: 'Plan nutritionnel', emoji: '📋', action: { type: 'message', payload: 'Créer un plan nutrition' } },
      { id: 'qr-n2', text: 'Calculateur calories', emoji: '🔢', action: { type: 'external_link', payload: '/calculators/calories' } },
      { id: 'qr-n3', text: 'Conseils compléments', emoji: '💊', action: { type: 'message', payload: 'Compléments alimentaires' } },
    ],
    isAvailable: true,
    responseTime: 'En quelques secondes',
  },

  // 4. Spécialiste Équipement
  {
    id: 'agent-equipment',
    name: 'Spécialiste Équipement',
    displayName: 'Expert Équipement',
    emoji: '🏋️',
    avatar: '/agents/agent-equipment.svg',
    color: '#f59e0b',
    description: 'Gestion du matériel et équipements de salle',
    specialties: ['matériel', 'maintenance', 'inventaire', 'achat'],
    greeting: '🏋️ Hello! Je vous aide avec tout ce qui concerne l\'équipement de votre salle.',
    quickReplies: [
      { id: 'qr-e1', text: 'Inventaire', emoji: '📦', action: { type: 'message', payload: 'Gérer inventaire' } },
      { id: 'qr-e2', text: 'Maintenance', emoji: '🔧', action: { type: 'message', payload: 'Planning maintenance' } },
      { id: 'qr-e3', text: 'Recommandations', emoji: '⭐', action: { type: 'message', payload: 'Recommandations équipement' } },
    ],
    isAvailable: true,
    responseTime: 'En quelques secondes',
  },

  // 5. Coach Gestion Business
  {
    id: 'agent-business',
    name: 'Coach Gestion',
    displayName: 'Business Manager Marie',
    emoji: '📊',
    avatar: '/agents/agent-business.svg',
    color: '#3b82f6',
    description: 'Gestion business, analytics et stratégie',
    specialties: ['gestion', 'analytics', 'revenue', 'stratégie'],
    greeting: '📊 Bonjour! Je suis Marie, je vous aide à développer votre business fitness.',
    quickReplies: [
      { id: 'qr-b1', text: 'Dashboard', emoji: '📈', action: { type: 'external_link', payload: '/dashboard' } },
      { id: 'qr-b2', text: 'Rapports', emoji: '📑', action: { type: 'message', payload: 'Générer rapport' } },
      { id: 'qr-b3', text: 'Stratégie croissance', emoji: '🚀', action: { type: 'message', payload: 'Stratégie' } },
    ],
    isAvailable: true,
    responseTime: 'En quelques secondes',
  },

  // 6. Analyste Performance
  {
    id: 'agent-analytics',
    name: 'Analyste Performance',
    displayName: 'Data Analyst Thomas',
    emoji: '📈',
    avatar: '/agents/agent-analytics.svg',
    color: '#8b5cf6',
    description: 'Statistiques, KPIs et analyse de données',
    specialties: ['statistiques', 'KPI', 'reporting', 'data'],
    greeting: '📈 Salut! Thomas ici. Plongeons dans vos données et statistiques!',
    quickReplies: [
      { id: 'qr-a1', text: 'KPIs clés', emoji: '🎯', action: { type: 'message', payload: 'Mes KPIs' } },
      { id: 'qr-a2', text: 'Rapport mensuel', emoji: '📊', action: { type: 'message', payload: 'Rapport du mois' } },
      { id: 'qr-a3', text: 'Prédictions', emoji: '🔮', action: { type: 'message', payload: 'Prédictions' } },
    ],
    isAvailable: true,
    responseTime: 'En quelques secondes',
  },

  // 7. Support Technique
  {
    id: 'agent-support',
    name: 'Support Technique',
    displayName: 'Tech Support Lucas',
    emoji: '🔧',
    avatar: '/agents/agent-support.svg',
    color: '#ec4899',
    description: 'Assistance technique et résolution de problèmes',
    specialties: ['bugs', 'installation', 'configuration', 'troubleshooting'],
    greeting: '🔧 Hey! Lucas du support technique. Quel problème puis-je résoudre pour vous?',
    quickReplies: [
      { id: 'qr-s1', text: 'Bug report', emoji: '🐛', action: { type: 'form', payload: { formId: 'bug-report' } } },
      { id: 'qr-s2', text: 'Guide installation', emoji: '📚', action: { type: 'external_link', payload: '/docs/installation' } },
      { id: 'qr-s3', text: 'FAQ technique', emoji: '❓', action: { type: 'external_link', payload: '/faq' } },
    ],
    isAvailable: true,
    responseTime: 'En quelques minutes',
  },

  // 8. Conseiller Facturation
  {
    id: 'agent-billing',
    name: 'Conseiller Facturation',
    displayName: 'Billing Specialist Emma',
    emoji: '💳',
    avatar: '/agents/agent-billing.svg',
    color: '#14b8a6',
    description: 'Paiements, abonnements et facturation',
    specialties: ['paiements', 'factures', 'abonnements', 'remboursements'],
    greeting: '💳 Bonjour! Emma à votre service pour toutes questions de facturation.',
    quickReplies: [
      { id: 'qr-bi1', text: 'Mes factures', emoji: '📄', action: { type: 'external_link', payload: '/billing/invoices' } },
      { id: 'qr-bi2', text: 'Changer d\'offre', emoji: '🔄', action: { type: 'message', payload: 'Changer abonnement' } },
      { id: 'qr-bi3', text: 'Moyen de paiement', emoji: '💳', action: { type: 'message', payload: 'Modifier paiement' } },
    ],
    isAvailable: true,
    responseTime: 'En quelques secondes',
  },

  // 9. Expert Marketing
  {
    id: 'agent-marketing',
    name: 'Expert Marketing',
    displayName: 'Marketing Manager Julie',
    emoji: '📱',
    avatar: '/agents/agent-marketing.svg',
    color: '#f97316',
    description: 'Stratégies marketing et acquisition clients',
    specialties: ['marketing', 'acquisition', 'retention', 'campagnes'],
    greeting: '📱 Salut! Julie du marketing. Boostons votre visibilité ensemble!',
    quickReplies: [
      { id: 'qr-m1', text: 'Campagnes', emoji: '📢', action: { type: 'message', payload: 'Créer campagne' } },
      { id: 'qr-m2', text: 'Templates email', emoji: '✉️', action: { type: 'external_link', payload: '/marketing/templates' } },
      { id: 'qr-m3', text: 'Analytics marketing', emoji: '📊', action: { type: 'message', payload: 'Stats marketing' } },
    ],
    isAvailable: true,
    responseTime: 'En quelques secondes',
  },

  // 10. Formateur & Tutoriels
  {
    id: 'agent-training',
    name: 'Formateur',
    displayName: 'Trainer Paul',
    emoji: '🎓',
    avatar: '/agents/agent-training.svg',
    color: '#06b6d4',
    description: 'Formation, tutoriels et onboarding',
    specialties: ['formation', 'tutoriels', 'onboarding', 'best-practices'],
    greeting: '🎓 Hello! Paul ici. Je vais vous former à utiliser ePerformance comme un pro!',
    quickReplies: [
      { id: 'qr-t1', text: 'Guide débutant', emoji: '🚀', action: { type: 'external_link', payload: '/docs/getting-started' } },
      { id: 'qr-t2', text: 'Vidéos tuto', emoji: '🎥', action: { type: 'external_link', payload: '/tutorials' } },
      { id: 'qr-t3', text: 'Certification', emoji: '🏆', action: { type: 'message', payload: 'Certification ePerformance' } },
    ],
    isAvailable: true,
    responseTime: 'En quelques secondes',
  },

  // ... 17 autres agents à définir selon les besoins spécifiques
  // Exemples d'agents supplémentaires:
  // - Agent Planning & Réservations
  // - Agent Gestion Membres
  // - Agent Communication (SMS/Email)
  // - Agent RH & Staff
  // - Agent Comptabilité
  // - Agent Juridique & Conformité
  // - Agent Intégrations & API
  // - Agent Mobile App
  // - Agent Sécurité & Accès
  // - Agent Communauté & Social
  // - Agent Events & Challenges
  // - Agent Partenariats
  // - Agent Feedback & Reviews
  // - Agent Data Export
  // - Agent White Label
  // - Agent Développeur (API docs)
  // - Agent Enterprise Solutions
];

// Helper pour récupérer un agent
export const getAgent = (id: string): Agent | undefined => {
  return AGENTS.find(agent => agent.id === id);
};

// Agent par défaut
export const DEFAULT_AGENT = AGENTS[0]; // Agent Accueil
```

---

## 3. PHASE 2: DESIGN SYSTEM

### 3.1 Composants UI de Base (Jours 3-4)

**Button.tsx:**
```typescript
import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantStyles = {
    primary: 'bg-gradient-to-r from-ep-violet-500 to-ep-purple-600 text-white hover:from-ep-violet-600 hover:to-ep-purple-700 shadow-md hover:shadow-lg',
    secondary: 'bg-white text-ep-violet-600 border-2 border-gray-200 hover:border-ep-violet-500 hover:bg-ep-violet-50',
    ghost: 'bg-transparent text-ep-violet-600 hover:bg-ep-violet-50',
  };
  
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  
  return (
    <motion.button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="animate-spin" size={16} />}
      {children}
    </motion.button>
  );
};
```

**Avatar.tsx:**
```typescript
import React from 'react';

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg';
  emoji?: string;
  color?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'Avatar',
  size = 'md',
  emoji,
  color = '#a855f7',
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
  };
  
  if (emoji) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-medium shadow-md`}
        style={{ backgroundColor: color }}
      >
        <span>{emoji}</span>
      </div>
    );
  }
  
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`${sizeClasses[size]} rounded-full object-cover border-2 border-white shadow-md`}
      />
    );
  }
  
  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center text-white font-semibold shadow-md`}
      style={{ backgroundColor: color }}
    >
      {alt.charAt(0).toUpperCase()}
    </div>
  );
};
```

### 3.2 Animations Personnalisées (animations.css)

```css
/* src/styles/animations.css */

/* Pulse personnalisé ePerformance */
@keyframes ep-pulse {
  0%, 100% {
    box-shadow: 0 4px 16px rgba(168, 85, 247, 0.32), 0 2px 8px rgba(0, 0, 0, 0.12);
    transform: scale(1);
  }
  50% {
    box-shadow: 0 6px 24px rgba(168, 85, 247, 0.48), 0 4px 12px rgba(0, 0, 0, 0.16);
    transform: scale(1.02);
  }
}

.ep-pulse {
  animation: ep-pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Typing indicator dots */
@keyframes typing-dot {
  0%, 60%, 100% {
    opacity: 0.3;
    transform: scale(0.8);
  }
  30% {
    opacity: 1;
    transform: scale(1);
  }
}

.typing-dot {
  animation: typing-dot 1.4s infinite;
}

.typing-dot:nth-child(1) {
  animation-delay: 0s;
}

.typing-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dot:nth-child(3) {
  animation-delay: 0.4s;
}

/* Slide in from bottom */
@keyframes slideInBottom {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.slide-in-bottom {
  animation: slideInBottom 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

/* Bounce subtle */
@keyframes bounce-subtle {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}

.bounce-subtle {
  animation: bounce-subtle 1s ease-in-out infinite;
}

/* Shimmer effect for loading */
@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}

.shimmer {
  background: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e0e0e0 50%,
    #f0f0f0 75%
  );
  background-size: 1000px 100%;
  animation: shimmer 2s infinite;
}

/* Gradient animation */
@keyframes gradient-shift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.gradient-animate {
  background-size: 200% 200%;
  animation: gradient-shift 3s ease infinite;
}
```

---

## 4. PHASE 3: COMPOSANTS UI

### 4.1 ChatbotLauncher (Jour 5)

```typescript
// src/components/Chatbot/ChatbotLauncher.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X } from 'lucide-react';
import { useChatbot } from '../../hooks/useChatbot';

export const ChatbotLauncher: React.FC = () => {
  const { state, actions } = useChatbot();
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  
  // Afficher tooltip après 5s
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!state.isOpen && !state.hasInteracted) {
        setShowTooltip(true);
      }
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [state.isOpen, state.hasInteracted]);
  
  // Détecter nouveaux messages
  useEffect(() => {
    if (!state.isOpen && state.messages.length > 0) {
      const lastMessage = state.messages[state.messages.length - 1];
      if (lastMessage.type === 'bot') {
        setHasNewMessage(true);
      }
    }
  }, [state.messages, state.isOpen]);
  
  const handleClick = () => {
    actions.toggleChat();
    setHasNewMessage(false);
    setShowTooltip(false);
  };
  
  return (
    <>
      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && !state.isOpen && (
          <motion.div
            className="fixed bottom-24 right-6 bg-white rounded-lg shadow-ep p-4 max-w-xs z-[9998]"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
          >
            <button
              onClick={() => setShowTooltip(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
            <p className="text-sm text-gray-700 pr-4">
              👋 Besoin d'aide? Je suis là pour vous!
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Launcher Button */}
      <motion.button
        onClick={handleClick}
        className="fixed bottom-6 right-6 w-16 h-16 rounded-full bg-gradient-to-br from-ep-violet-500 to-ep-purple-600 text-white shadow-ep hover:shadow-ep-lg flex items-center justify-center z-[9999] ep-pulse"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={state.isOpen ? 'Fermer le chat' : 'Ouvrir le chat'}
      >
        {/* Badge notification */}
        <AnimatePresence>
          {hasNewMessage && (
            <motion.div
              className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              1
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Icon */}
        <motion.div
          animate={{ rotate: state.isOpen ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {state.isOpen ? <X size={28} /> : <MessageCircle size={28} />}
        </motion.div>
      </motion.button>
    </>
  );
};
```

### 4.2 ChatbotWindow (Jour 6)

```typescript
// src/components/Chatbot/ChatbotWindow.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatbotHeader } from './ChatbotHeader';
import { ChatbotMessages } from './ChatbotMessages';
import { ChatbotInput } from './ChatbotInput';
import { useChatbot } from '../../hooks/useChatbot';

export const ChatbotWindow: React.FC = () => {
  const { state } = useChatbot();
  
  return (
    <AnimatePresence>
      {state.isOpen && (
        <motion.div
          className="fixed bottom-24 right-6 w-[400px] max-w-[calc(100vw-3rem)] h-[600px] max-h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-ep-lg flex flex-col overflow-hidden z-[9998] md:w-[400px] sm:w-full sm:h-full sm:bottom-0 sm:right-0 sm:rounded-none sm:max-w-full sm:max-h-full"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 30,
          }}
        >
          {/* Header */}
          <ChatbotHeader />
          
          {/* Messages */}
          <div className="flex-1 overflow-hidden">
            <ChatbotMessages />
          </div>
          
          {/* Input */}
          <ChatbotInput />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
```

### 4.3 ChatbotHeader (Jour 6)

```typescript
// src/components/Chatbot/ChatbotHeader.tsx
import React from 'react';
import { X, Minimize2, MoreVertical } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { useChatbot } from '../../hooks/useChatbot';

export const ChatbotHeader: React.FC = () => {
  const { state, actions } = useChatbot();
  const currentAgent = state.currentAgent;
  
  return (
    <div className="bg-gradient-to-r from-ep-violet-500 to-ep-purple-600 text-white p-5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Avatar
          src={currentAgent?.avatar}
          emoji={currentAgent?.emoji}
          alt={currentAgent?.displayName || 'ePerformance'}
          size="md"
          color={currentAgent?.color}
        />
        <div>
          <h3 className="font-semibold text-base">
            {currentAgent?.displayName || 'ePerformance'}
          </h3>
          <div className="flex items-center gap-2 text-sm opacity-90">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span>{currentAgent?.responseTime || 'En ligne'}</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={actions.minimizeChat}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          aria-label="Réduire"
        >
          <Minimize2 size={18} />
        </button>
        <button
          onClick={actions.closeChat}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          aria-label="Fermer"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
};
```

### 4.4 Composants Restants (Jours 7-9)

Les autres composants suivent la même structure:
- **ChatbotMessages.tsx**: Scroll area avec liste des messages
- **ChatbotMessage.tsx**: Bulle de message individuelle
- **ChatbotInput.tsx**: Textarea avec bouton d'envoi
- **QuickReplies.tsx**: Grid de boutons de réponse rapide
- **TypingIndicator.tsx**: Animation de typing
- **AgentSelector.tsx**: Modal de sélection d'agent
- **AgentCard.tsx**: Card présentant un agent

---

## 5. PHASE 4: SYSTÈME MULTI-AGENTS

### 5.1 Hook useChatbot (Jour 10)

```typescript
// src/hooks/useChatbot.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Message, Conversation, Agent } from '../types';
import { DEFAULT_AGENT } from '../data/agents';

interface ChatbotState {
  isOpen: boolean;
  isMinimized: boolean;
  hasInteracted: boolean;
  currentAgent: Agent;
  messages: Message[];
  isTyping: boolean;
  userContext: UserContext;
  conversations: Conversation[];
}

interface ChatbotActions {
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  minimizeChat: () => void;
  switchAgent: (agentId: string) => void;
  sendMessage: (content: string) => Promise<void>;
  addMessage: (message: Message) => void;
  setTyping: (isTyping: boolean) => void;
  updateContext: (context: Partial<UserContext>) => void;
}

export const useChatbot = create<ChatbotState & { actions: ChatbotActions }>()(
  persist(
    (set, get) => ({
      // State
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
        isReturningVisitor: false,
        visitCount: 1,
        firstVisit: new Date(),
        device: detectDevice(),
        browser: detectBrowser(),
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        hasTrialStarted: false,
        hasPurchased: false,
      },
      conversations: [],
      
      // Actions
      actions: {
        openChat: () => {
          set({ isOpen: true, isMinimized: false, hasInteracted: true });
          
          // Envoyer message d'accueil si premier message
          const { messages, currentAgent } = get();
          if (messages.length === 0) {
            get().actions.addMessage({
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
          const { isOpen } = get();
          if (isOpen) {
            get().actions.closeChat();
          } else {
            get().actions.openChat();
          }
        },
        
        minimizeChat: () => set({ isMinimized: true, isOpen: false }),
        
        switchAgent: async (agentId: string) => {
          const agent = AGENTS.find(a => a.id === agentId);
          if (!agent) return;
          
          set({ currentAgent: agent });
          
          // Message de transition
          get().actions.addMessage({
            id: generateMessageId(),
            conversationId: 'current',
            type: 'system',
            content: `Vous êtes maintenant en contact avec ${agent.displayName}`,
            timestamp: new Date(),
            status: 'delivered',
          });
          
          // Message d'accueil du nouvel agent
          await new Promise(resolve => setTimeout(resolve, 500));
          get().actions.addMessage({
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
          const userMessage: Message = {
            id: generateMessageId(),
            conversationId: 'current',
            type: 'user',
            content,
            timestamp: new Date(),
            status: 'sending',
          };
          
          get().actions.addMessage(userMessage);
          
          // Simuler réponse (à remplacer par vrai appel API)
          set({ isTyping: true });
          
          try {
            // Update message status
            set(state => ({
              messages: state.messages.map(msg =>
                msg.id === userMessage.id ? { ...msg, status: 'sent' } : msg
              ),
            }));
            
            // Appel API (simulation)
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            const botResponse = await getBotResponse(content, get().currentAgent);
            
            get().actions.addMessage({
              id: generateMessageId(),
              conversationId: 'current',
              type: 'bot',
              content: botResponse.content,
              agentId: get().currentAgent.id,
              agentName: get().currentAgent.displayName,
              avatar: get().currentAgent.avatar,
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
            set({ isTyping: false });
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
      },
    }),
    {
      name: 'eperformance-chatbot',
      partialize: (state) => ({
        messages: state.messages,
        hasInteracted: state.hasInteracted,
        userContext: state.userContext,
      }),
    }
  )
);

// Helper functions
const generateUserId = () => `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
const generateSessionId = () => `session_${Date.now()}`;
const generateMessageId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const detectDevice = (): 'mobile' | 'tablet' | 'desktop' => {
  const width = window.innerWidth;
  if (width < 640) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
};

const detectBrowser = () => {
  const ua = navigator.userAgent;
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari')) return 'Safari';
  return 'Other';
};

// Bot response logic (à enrichir avec IA)
const getBotResponse = async (userMessage: string, agent: Agent) => {
  // Simulation simple - à remplacer par appel API + IA
  return {
    content: `Je comprends votre question "${userMessage}". Laissez-moi vous aider avec ça!`,
    quickReplies: agent.quickReplies,
  };
};
```

---

## 6. PHASE 5: INTELLIGENCE & TRIGGERS

### 6.1 Système de Triggers (Jour 11)

```typescript
// src/hooks/useTriggers.ts
import { useEffect } from 'react';
import { useChatbot } from './useChatbot';
import { TRIGGERS } from '../data/triggers';

export const useTriggers = () => {
  const { state, actions } = useChatbot();
  
  useEffect(() => {
    const activeTriggers = TRIGGERS.filter(t => t.enabled);
    
    activeTriggers.forEach(trigger => {
      const shouldTrigger = evaluateTrigger(trigger, state.userContext);
      
      if (shouldTrigger && !hasTriggered(trigger.id)) {
        executeTrigger(trigger, actions);
        markTriggered(trigger.id);
      }
    });
  }, [state.userContext]);
};

// src/data/triggers.ts
export const TRIGGERS: TriggerConfig[] = [
  {
    id: 'welcome-message',
    name: 'Message de bienvenue',
    enabled: true,
    conditions: [
      { type: 'time_on_page', operator: 'gt', value: 5000 }, // 5 secondes
    ],
    action: {
      type: 'show_message',
      payload: {
        content: '👋 Besoin d\'aide pour démarrer?',
        agent: 'agent-accueil',
      },
    },
    priority: 1,
    cooldown: 86400000, // 24h
  },
  
  {
    id: 'pricing-page-help',
    name: 'Aide page tarifs',
    enabled: true,
    conditions: [
      { type: 'page_match', operator: 'eq', value: '/pricing' },
      { type: 'time_on_page', operator: 'gt', value: 10000 },
    ],
    action: {
      type: 'open_chat',
      payload: {
        message: '💰 Des questions sur nos tarifs? Je peux vous aider!',
        agent: 'agent-billing',
      },
    },
    priority: 2,
    cooldown: 3600000, // 1h
  },
  
  {
    id: 'exit-intent',
    name: 'Exit intent',
    enabled: true,
    conditions: [
      { type: 'exit_intent', operator: 'eq', value: true },
    ],
    action: {
      type: 'show_message',
      payload: {
        content: '🙋 Vous partez déjà? Puis-je vous aider avec quelque chose?',
      },
    },
    priority: 3,
    cooldown: 7200000, // 2h
  },
  
  {
    id: 'scroll-depth-50',
    name: 'Scroll 50%',
    enabled: true,
    conditions: [
      { type: 'scroll_depth', operator: 'gt', value: 50 },
      { type: 'page_match', operator: 'contains', value: '/features' },
    ],
    action: {
      type: 'suggest_agent',
      payload: {
        message: 'Besoin de détails sur une fonctionnalité?',
        suggestedAgents: ['agent-fitness', 'agent-business'],
      },
    },
    priority: 4,
  },
];
```

### 6.2 Intégration IA (Jour 12)

```typescript
// src/services/ai.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
});

export const getAIResponse = async (
  userMessage: string,
  agent: Agent,
  conversationHistory: Message[]
) => {
  const systemPrompt = `Tu es ${agent.displayName}, ${agent.description}.
Tes spécialités sont: ${agent.specialties.join(', ')}.
Tu dois aider l'utilisateur de manière professionnelle mais amicale.
Sois concis et propose des actions concrètes.
Utilise des emojis de manière subtile.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.slice(-10).map(msg => ({
      role: msg.type === 'user' ? 'user' : 'assistant',
      content: msg.content,
    })),
    { role: 'user', content: userMessage },
  ];

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages,
    temperature: 0.7,
    max_tokens: 300,
  });

  return response.choices[0].message.content || 'Désolé, je n\'ai pas pu générer une réponse.';
};
```

---

## 7. PHASE 6: INTÉGRATIONS

### 7.1 Analytics & Tracking (Jour 13)

```typescript
// src/services/analytics.ts
export const trackChatbotEvent = (event: string, properties?: Record<string, any>) => {
  // Google Analytics
  if (window.gtag) {
    window.gtag('event', event, {
      event_category: 'Chatbot',
      ...properties,
    });
  }
  
  // Custom analytics
  console.log(`[Analytics] ${event}`, properties);
};

// Events à tracker:
// - chatbot_opened
// - chatbot_closed
// - message_sent
// - agent_switched
// - quick_reply_clicked
// - conversation_started
// - conversation_resolved
// - feedback_submitted
```

### 7.2 Backend API (Jour 14)

```typescript
// Backend: api/chatbot.ts
import express from 'express';
import { Server } from 'socket.io';

const app = express();
const io = new Server(server);

// WebSocket pour chat temps réel
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('message', async (data) => {
    const { message, userId, agentId } = data;
    
    // Sauvegarder message
    await saveMessage(message);
    
    // Générer réponse IA
    const response = await getAIResponse(message, agentId);
    
    // Envoyer réponse
    socket.emit('bot_response', response);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// REST endpoints
app.post('/api/chatbot/conversation', async (req, res) => {
  // Créer nouvelle conversation
});

app.get('/api/chatbot/conversations/:userId', async (req, res) => {
  // Récupérer historique
});

app.post('/api/chatbot/feedback', async (req, res) => {
  // Sauvegarder feedback
});
```

---

## 8. PHASE 7: TESTS & OPTIMISATION

### 8.1 Tests (Jours 15-16)

```typescript
// Tests unitaires (Vitest)
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChatbotLauncher } from '../components/Chatbot/ChatbotLauncher';

describe('ChatbotLauncher', () => {
  it('should render launcher button', () => {
    render(<ChatbotLauncher />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
  
  it('should open chat on click', () => {
    // Test logic
  });
});
```

### 8.2 Performance (Jour 17)

- Lazy loading des composants
- Code splitting par route
- Image optimization
- Memoization avec React.memo
- Debounce sur typing events
- WebSocket connection pooling

### 8.3 Accessibilité (Jour 18)

- ARIA labels complets
- Navigation clavier
- Screen reader support
- Focus management
- Contraste de couleurs WCAG AA

---

## 9. TIMELINE & PRIORITÉS

### Sprint 1: Fondations (Semaine 1)
✅ Jour 1: Setup projet  
✅ Jour 2: Configuration des 27 agents  
✅ Jour 3-4: Design system & composants UI  
✅ Jour 5: ChatbotLauncher  

### Sprint 2: UI Core (Semaine 2)
✅ Jour 6-7: ChatbotWindow + Header  
✅ Jour 8-9: Messages + Input  
✅ Jour 10: Hook useChatbot  

### Sprint 3: Intelligence (Semaine 3)
✅ Jour 11: Système de triggers  
✅ Jour 12: Intégration IA  
✅ Jour 13: Analytics  
✅ Jour 14: Backend API  

### Sprint 4: Polish (Semaine 4)
✅ Jour 15-16: Tests  
✅ Jour 17: Performance  
✅ Jour 18: Accessibilité  
✅ Jour 19-20: Bug fixes & refinement  

### Déploiement (Jour 21)
🚀 Production ready!

---

## 📊 MÉTRIQUES DE SUCCÈS

**KPIs à suivre:**
1. Taux d'ouverture du chatbot: > 30%
2. Temps moyen de réponse: < 2 secondes
3. Taux de résolution: > 70%
4. Satisfaction utilisateur: > 4.5/5
5. Taux de conversion: +15% vs sans chatbot

---

## 🎨 BRANDING EPERFORMANCE

### Couleurs
- Primary: `#a855f7` (Violet)
- Secondary: `#8b5cf6` (Purple)
- Gradient: `linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)`

### Logos
- Logo principal: `/logo-ep.png`
- Logo noir: `/logo-ep-noir.png`
- Favicon: `/icon-512.png`

### Tone of Voice
- Professionnel mais accessible
- Motivant et positif
- Expert sans être condescendant
- Emojis subtils (🎯, 💪, 📊)

---

## 🚀 NEXT STEPS

1. **Valider l'architecture** avec l'équipe
2. **Définir les 17 agents restants** selon besoins métier
3. **Créer les assets visuels** (avatars des 27 agents)
4. **Choisir le provider IA** (OpenAI, Anthropic, custom)
5. **Setup environnement de développement**
6. **Démarrer Sprint 1** 🏁

---

**Document maintenu par**: Équipe ePerformance  
**Dernière mise à jour**: 11 septembre 2026  
**Version**: 1.0
