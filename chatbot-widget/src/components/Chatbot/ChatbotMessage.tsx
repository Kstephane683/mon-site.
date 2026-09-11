// components/Chatbot/ChatbotMessage.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Avatar } from '../ui/Avatar';
import { Message } from '../../types';
import { formatDate } from '../../utils/helpers';
import { QuickReplies } from './QuickReplies';

interface ChatbotMessageProps {
  message: Message;
}

export const ChatbotMessage: React.FC<ChatbotMessageProps> = ({ message }) => {
  const isUser = message.type === 'user';
  const isSystem = message.type === 'system';
  
  if (isSystem) {
    return (
      <motion.div
        className="flex justify-center px-4 py-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-xs text-text-muted bg-bg-card px-3 py-1 rounded-full border border-border">
          {message.content}
        </div>
      </motion.div>
    );
  }
  
  return (
    <motion.div
      className={`flex items-start gap-3 px-4 py-2 ${isUser ? 'flex-row-reverse' : ''}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {!isUser && (
        <Avatar
          src={message.avatar}
          emoji="🤖"
          alt={message.agentName || 'Bot'}
          size="sm"
          color="#c9a96e"
        />
      )}
      
      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[80%]`}>
        {!isUser && message.agentName && (
          <span className="text-xs text-gold mb-1 px-1 font-semibold">{message.agentName}</span>
        )}
        
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-gradient-to-r from-gold to-gold-light text-bg rounded-br-sm'
              : 'bg-bg-card text-text-soft rounded-bl-sm border border-border'
          }`}
          dangerouslySetInnerHTML={
            !isUser && message.content.includes('<') 
              ? { __html: message.content }
              : undefined
          }
        >
          {!(!isUser && message.content.includes('<')) && (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          )}
        </div>
        
        <span className="text-xs text-text-muted mt-1 px-1">
          {formatDate(message.timestamp)}
        </span>
        
        {!isUser && message.quickReplies && message.quickReplies.length > 0 && (
          <QuickReplies replies={message.quickReplies} />
        )}
      </div>
    </motion.div>
  );
};
