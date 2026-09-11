// components/Chatbot/TypingIndicator.tsx
import React from 'react';
import { Avatar } from '../ui/Avatar';
import { useChatbotStore } from '../../store/chatbotStore';

export const TypingIndicator: React.FC = () => {
  const { currentAgent } = useChatbotStore();
  
  return (
    <div className="flex items-start gap-3 px-4 py-2">
      <Avatar
        src={currentAgent.avatar}
        emoji={currentAgent.emoji}
        alt={currentAgent.displayName}
        size="sm"
        color={currentAgent.color}
      />
      <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 max-w-[80%]">
        <div className="flex gap-1">
          <div className="typing-dot w-2 h-2 bg-gray-400 rounded-full"></div>
          <div className="typing-dot w-2 h-2 bg-gray-400 rounded-full"></div>
          <div className="typing-dot w-2 h-2 bg-gray-400 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};
