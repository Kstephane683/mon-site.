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
