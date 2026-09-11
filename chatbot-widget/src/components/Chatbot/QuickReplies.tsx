// components/Chatbot/QuickReplies.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { QuickReply } from '../../types';
import { useChatbotStore } from '../../store/chatbotStore';

interface QuickRepliesProps {
  replies: QuickReply[];
}

export const QuickReplies: React.FC<QuickRepliesProps> = ({ replies }) => {
  const { sendMessage, switchAgent } = useChatbotStore();
  
  const handleClick = async (reply: QuickReply) => {
    const { action } = reply;
    
    switch (action.type) {
      case 'message':
        await sendMessage(action.payload);
        break;
      case 'agent_switch':
        await switchAgent(action.payload);
        break;
      case 'external_link':
        window.open(action.payload, '_blank');
        break;
      case 'form':
        // TODO: Implémenter formulaire
        console.log('Form:', action.payload);
        break;
    }
  };
  
  return (
    <motion.div
      className="flex flex-wrap gap-2 mt-3"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      {replies.map((reply) => (
        <motion.button
          key={reply.id}
          onClick={() => handleClick(reply)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border-2 border-ep-violet-200 text-ep-violet-700 rounded-full text-sm font-medium hover:bg-ep-violet-50 hover:border-ep-violet-400 transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {reply.emoji && <span>{reply.emoji}</span>}
          <span>{reply.text}</span>
        </motion.button>
      ))}
    </motion.div>
  );
};
