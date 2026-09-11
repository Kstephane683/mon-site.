// components/Chatbot/ChatbotHeader.tsx
import React from 'react';
import { X, Minimize2 } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { useChatbotStore } from '../../store/chatbotStore';

export const ChatbotHeader: React.FC = () => {
  const { currentAgent, closeChat, minimizeChat } = useChatbotStore();
  
  return (
    <div className="bg-gradient-to-r from-bg-card to-bg-card2 text-text border-b border-gold-border p-5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Avatar
          src={currentAgent.avatar}
          emoji={currentAgent.emoji}
          alt={currentAgent.displayName}
          size="md"
          color={currentAgent.color}
        />
        <div>
          <h3 className="font-semibold text-base text-gold font-cormorant">
            {currentAgent.displayName}
          </h3>
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <span className="w-2 h-2 bg-gold rounded-full animate-pulse"></span>
            <span>{currentAgent.responseTime}</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={minimizeChat}
          className="p-2 hover:bg-gold-bg rounded-lg transition-colors text-text-soft hover:text-gold"
          aria-label="Réduire"
        >
          <Minimize2 size={18} />
        </button>
        <button
          onClick={closeChat}
          className="p-2 hover:bg-gold-bg rounded-lg transition-colors text-text-soft hover:text-gold"
          aria-label="Fermer"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
};
