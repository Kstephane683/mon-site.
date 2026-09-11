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

export interface FormConfig {
  formId: string;
  fields?: FormField[];
}

export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'textarea';
  required?: boolean;
  placeholder?: string;
}
