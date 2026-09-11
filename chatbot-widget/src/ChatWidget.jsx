import React, { useState } from 'react';
import { DeepChat } from 'deep-chat-react';
import './styles/widget.css';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Backend Railway URL
  const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:8000/api/chatbot/message'
    : 'https://web-production-4ab53.up.railway.app/api/chatbot/message';
  
  const handleNewMessage = () => {
    if (!isOpen) {
      setUnreadCount(prev => prev + 1);
    }
  };
  
  const handleOpen = () => {
    setIsOpen(true);
    setUnreadCount(0);
  };
  
  return (
    <div className="eperf-chat-widget">
      {/* Bouton flottant avec logo */}
      <button 
        className={`eperf-chat-toggle ${isOpen ? 'active' : ''}`}
        onClick={() => isOpen ? setIsOpen(false) : handleOpen()}
        aria-label={isOpen ? "Fermer le chat" : "Ouvrir le chat"}
      >
        {isOpen ? (
          <span style={{fontSize: '24px', fontWeight: 'bold'}}>✕</span>
        ) : (
          <img 
            src="/icon-eperf.png" 
            alt="ePerformance" 
            style={{width: '40px', height: '40px', borderRadius: '50%'}}
          />
        )}
        {!isOpen && unreadCount > 0 && (
          <span className="eperf-chat-badge">{unreadCount}</span>
        )}
      </button>
      
      {/* Panel chat avec design pro */}
      {isOpen && (
        <div className="eperf-chat-panel">
          {/* Header avec logo et titre */}
          <div className="eperf-chat-header">
            <div className="eperf-chat-header-content">
              <img 
                src="/icon-eperf.png" 
                alt="ePerformance" 
                className="eperf-chat-avatar-img"
              />
              <div className="eperf-chat-header-text">
                <h3>Assistant ePerformance</h3>
                <p className="eperf-chat-status">
                  <span className="status-dot"></span>
                  En ligne
                </p>
              </div>
            </div>
            <button 
              className="eperf-chat-close"
              onClick={() => setIsOpen(false)}
              aria-label="Fermer"
            >
              ✕
            </button>
          </div>
          
          {/* Corps du chat */}
          <div className="eperf-chat-body">
            <DeepChat
              style={{width: '100%', height: '100%', backgroundColor: '#ffffff'}}
              demo={true}
              request={{
                url: API_URL,
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                additionalBodyProps: {
                  site_id: 'eperformance_vitrine'
                }
              }}
              requestBodyLimits={{maxMessages: 10}}
              requestInterceptor={(requestDetails) => {
                const messages = requestDetails.body.messages || [];
                requestDetails.body = {
                  messages: messages.map(msg => ({
                    role: msg.role === 'user' ? 'user' : 'assistant',
                    text: msg.text || msg.content || ''
                  })),
                  site_id: 'eperformance_vitrine'
                };
                return requestDetails;
              }}
              responseInterceptor={(response) => {
                if (response.html) {
                  return {html: response.html};
                }
                return response;
              }}
              introMessage={{
                html: `
                  <div style="padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; color: white; margin-bottom: 16px;">
                    <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 600;">👋 Bienvenue chez ePerformance</h2>
                    <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; opacity: 0.95;">
                      Je suis votre assistant IA dédié à la <strong>croissance digitale</strong>.
                    </p>
                    <div style="background: rgba(255,255,255,0.15); padding: 16px; border-radius: 8px; backdrop-filter: blur(10px);">
                      <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600;">💡 Je peux vous aider à :</p>
                      <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8;">
                        <li>Générer <strong>+40% de leads qualifiés</strong></li>
                        <li>Optimiser votre <strong>CAC et LTV</strong></li>
                        <li>Créer votre <strong>système d'acquisition</strong></li>
                        <li>Développer votre <strong>présence digitale</strong></li>
                      </ul>
                    </div>
                    <p style="margin: 16px 0 0 0; font-size: 14px; font-weight: 500;">
                      🎯 Quel est votre objectif principal ?
                    </p>
                  </div>
                `
              }}
              messageStyles={{
                default: {
                  shared: {
                    bubble: {
                      maxWidth: '80%',
                      borderRadius: '18px',
                      padding: '12px 16px',
                      fontSize: '15px',
                      lineHeight: '1.5',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                    }
                  },
                  user: {
                    bubble: {
                      backgroundColor: '#667eea',
                      color: '#ffffff',
                      marginLeft: 'auto',
                      borderBottomRightRadius: '4px'
                    }
                  },
                  ai: {
                    bubble: {
                      backgroundColor: '#f7f7f8',
                      color: '#1a1a1a',
                      border: '1px solid #e5e5e7',
                      borderBottomLeftRadius: '4px'
                    }
                  }
                }
              }}
              textInput={{
                placeholder: {
                  text: 'Écrivez votre message...',
                  style: {
                    color: '#999999',
                    fontSize: '15px'
                  }
                },
                styles: {
                  container: {
                    backgroundColor: '#ffffff',
                    border: '2px solid #e5e5e7',
                    borderRadius: '24px',
                    padding: '12px 20px',
                    transition: 'border-color 0.2s'
                  },
                  text: {
                    color: '#1a1a1a',
                    fontSize: '15px'
                  }
                }
              }}
              submitButtonStyles={{
                submit: {
                  container: {
                    default: {
                      backgroundColor: '#667eea',
                      borderRadius: '50%',
                      width: '40px',
                      height: '40px',
                      padding: '0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s'
                    },
                    hover: {
                      backgroundColor: '#5568d3',
                      transform: 'scale(1.05)'
                    }
                  },
                  svg: {
                    styles: {
                      default: {
                        width: '20px',
                        height: '20px',
                        fill: '#ffffff'
                      }
                    }
                  }
                }
              }}
              onNewMessage={handleNewMessage}
            />
          </div>
          
          {/* Footer avec logo */}
          <div className="eperf-chat-footer">
            <img 
              src="/logo-eperf-dark.png" 
              alt="ePerformance" 
              style={{height: '18px', opacity: '0.8'}}
            />
          </div>
        </div>
      )}
    </div>
  );
}
