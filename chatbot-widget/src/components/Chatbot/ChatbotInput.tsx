// components/Chatbot/ChatbotInput.tsx
import React, { useState, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import { useChatbotStore } from '../../store/chatbotStore';

export const ChatbotInput: React.FC = () => {
  const [input, setInput] = useState('');
  const { sendMessage, isTyping } = useChatbotStore();
  
  const handleSubmit = async () => {
    if (!input.trim() || isTyping) return;
    
    await sendMessage(input.trim());
    setInput('');
  };
  
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };
  
  return (
    <div className="p-4 bg-white border-t border-gray-200">
      <div className="flex items-end gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Écrivez votre message..."
          rows={1}
          className="flex-1 resize-none px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-ep-violet-500 focus:outline-none text-sm"
          style={{ maxHeight: '120px' }}
          disabled={isTyping}
        />
        <button
          onClick={handleSubmit}
          disabled={!input.trim() || isTyping}
          className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-r from-ep-violet-500 to-ep-purple-600 text-white flex items-center justify-center hover:from-ep-violet-600 hover:to-ep-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          aria-label="Envoyer"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};
