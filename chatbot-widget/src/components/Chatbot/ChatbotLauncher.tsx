// components/Chatbot/ChatbotLauncher.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X } from 'lucide-react';
import { useChatbotStore } from '../../store/chatbotStore';

export const ChatbotLauncher: React.FC = () => {
  const { isOpen, hasInteracted, messages, toggleChat } = useChatbotStore();
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  
  // Afficher tooltip après 5s
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isOpen && !hasInteracted) {
        setShowTooltip(true);
      }
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [isOpen, hasInteracted]);
  
  // Détecter nouveaux messages
  useEffect(() => {
    if (!isOpen && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.type === 'bot') {
        setHasNewMessage(true);
      }
    }
  }, [messages, isOpen]);
  
  const handleClick = () => {
    toggleChat();
    setHasNewMessage(false);
    setShowTooltip(false);
  };
  
  return (
    <>
      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && !isOpen && (
          <motion.div
            className="fixed bottom-24 right-6 bg-bg-card border border-gold-border rounded-lg shadow-ep p-4 max-w-xs z-[9998]"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
          >
            <button
              onClick={() => setShowTooltip(false)}
              className="absolute top-2 right-2 text-text-muted hover:text-gold"
            >
              <X size={16} />
            </button>
            <p className="text-sm text-text-soft pr-4">
              👋 Besoin d'aide? Je suis là pour vous!
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Launcher Button */}
      <motion.button
        onClick={handleClick}
        className="fixed bottom-6 right-6 w-16 h-16 rounded-full bg-gradient-to-br from-gold to-gold-light text-bg shadow-ep hover:shadow-ep-lg flex items-center justify-center z-[9999]"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={isOpen ? 'Fermer le chat' : 'Ouvrir le chat'}
      >
        {/* Badge notification */}
        <AnimatePresence>
          {hasNewMessage && !isOpen && (
            <motion.div
              className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              1
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Icon */}
        <motion.div
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
        </motion.div>
      </motion.button>
    </>
  );
};
