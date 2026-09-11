// components/Chatbot/ChatbotHeader.tsx
import React from 'react';
import { X, Minimize2 } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { useChatbotStore } from '../../store/chatbotStore';

export const ChatbotHeader: React.FC = () => {
  const { currentAgent, closeChat, minimizeChat } = useChatbotStore();
  
  return (
    <div className="bg-gradient-to-r from-ep-violet-500 to-ep-purple-600 text-white p-5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Avatar
          src={currentAgent.avatar}
          emoji={currentAgent.emoji}
          alt={currentAgent.displayName}
          size="md"
          color={currentAgent.color}
        />
        <div>
          <h3 className="font-semibold text-base">
            {currentAgent.displayName}
          </h3>
          <div className="flex items-center gap-2 text-sm opacity-90">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span>{currentAgent.responseTime}</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={minimizeChat}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          aria-label="Réduire"
        >
          <Minimize2 size={18} />
        </button>
        <button
          onClick={closeChat}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          aria-label="Fermer"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
};
