// components/Chatbot/ChatbotWidget.tsx
import React from 'react';
import { ChatbotLauncher } from './ChatbotLauncher';
import { ChatbotWindow } from './ChatbotWindow';

export const ChatbotWidget: React.FC = () => {
  return (
    <div className="eperf-chatbot-widget">
      <ChatbotLauncher />
      <ChatbotWindow />
    </div>
  );
};
