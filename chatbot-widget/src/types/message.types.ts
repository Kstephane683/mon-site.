// types/message.types.ts
import { QuickReply } from './agent.types';

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

export interface Attachment {
  id: string;
  type: 'image' | 'file' | 'video';
  url: string;
  name: string;
  size?: number;
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
