// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ChatbotWidget } from './components/Chatbot';
import './styles/globals.css';
import './styles/animations.css';

// Fonction d'initialisation du widget
window.EperfChatWidget = {
  init: function(config = {}) {
    // Config par défaut
    const defaultConfig = {
      apiUrl: 'https://web-production-4ab53.up.railway.app',
      position: 'bottom-right',
      theme: 'violet',
    };
    
    const finalConfig = { ...defaultConfig, ...config };
    
    // Créer le conteneur si il n'existe pas
    let container = document.getElementById('eperf-chat-root');
    if (!container) {
      container = document.createElement('div');
      container.id = 'eperf-chat-root';
      document.body.appendChild(container);
    }
    
    // Monter le composant React
    const root = ReactDOM.createRoot(container);
    root.render(
      <React.StrictMode>
        <ChatbotWidget />
      </React.StrictMode>
    );
    
    console.log('✅ ePerformance Chatbot World-Class initialisé', finalConfig);
    console.log('📊 27 agents spécialisés disponibles');
  }
};

// Auto-init si data-auto-init présent
document.addEventListener('DOMContentLoaded', () => {
  const scriptTag = document.querySelector('script[src*="chatbot-widget"]');
  if (scriptTag && scriptTag.hasAttribute('data-auto-init')) {
    window.EperfChatWidget.init();
  }
});

// Type pour Window
declare global {
  interface Window {
    EperfChatWidget: {
      init: (config?: any) => void;
    };
  }
}
