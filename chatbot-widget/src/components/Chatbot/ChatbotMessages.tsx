// components/Chatbot/ChatbotMessages.tsx
import React, { useRef, useEffect } from 'react';
import { ChatbotMessage } from './ChatbotMessage';
import { TypingIndicator } from './TypingIndicator';
import { useChatbotStore } from '../../store/chatbotStore';

export const ChatbotMessages: React.FC = () => {
  const { messages, isTyping } = useChatbotStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);
  
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
      {messages.map((message) => (
        <ChatbotMessage key={message.id} message={message} />
      ))}
      
      {isTyping && <TypingIndicator />}
      
      <div ref={messagesEndRef} />
    </div>
  );
};
