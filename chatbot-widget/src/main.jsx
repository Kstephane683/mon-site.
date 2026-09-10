import React from 'react';
import ReactDOM from 'react-dom/client';
import ChatWidget from './ChatWidget';

// Fonction d'initialisation du widget
window.EperfChatWidget = {
  init: function(config = {}) {
    // Auto-détection environnement
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const defaultApiUrl = isLocalhost 
      ? 'http://localhost:8000'
      : 'https://api.eperformance.pro';
    
    // Config par défaut
    const defaultConfig = {
      apiUrl: defaultApiUrl,
      theme: 'gold',
      position: 'bottom-right'
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
        <ChatWidget config={finalConfig} />
      </React.StrictMode>
    );
    
    console.log('✅ ePerformance Chat Widget initialisé', finalConfig);
  }
};

// Auto-init si data-auto-init présent
document.addEventListener('DOMContentLoaded', () => {
  const scriptTag = document.querySelector('script[src*="chatbot-widget"]');
  if (scriptTag && scriptTag.hasAttribute('data-auto-init')) {
    window.EperfChatWidget.init();
  }
});
