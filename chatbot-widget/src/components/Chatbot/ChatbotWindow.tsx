// components/Chatbot/ChatbotWindow.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatbotHeader } from './ChatbotHeader';
import { ChatbotMessages } from './ChatbotMessages';
import { ChatbotInput } from './ChatbotInput';
import { useChatbotStore } from '../../store/chatbotStore';

export const ChatbotWindow: React.FC = () => {
  const { isOpen } = useChatbotStore();
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed bottom-24 right-6 w-[400px] max-w-[calc(100vw-3rem)] h-[600px] max-h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-ep-lg flex flex-col overflow-hidden z-[9998]"
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
          <ChatbotMessages />
          
          {/* Input */}
          <ChatbotInput />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
