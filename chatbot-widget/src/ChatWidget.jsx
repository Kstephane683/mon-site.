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
      {/* Bouton flottant */}
      <button 
        className={`eperf-chat-toggle ${isOpen ? 'active' : ''}`}
        onClick={() => isOpen ? setIsOpen(false) : handleOpen()}
        aria-label={isOpen ? "Fermer le chat" : "Ouvrir le chat"}
      >
        {isOpen ? '✕' : '💬'}
        {!isOpen && unreadCount > 0 && (
          <span className="eperf-chat-badge">{unreadCount}</span>
        )}
      </button>
      
      {/* Panel chat */}
      {isOpen && (
        <div className="eperf-chat-panel">
          <div className="eperf-chat-header">
            <div className="eperf-chat-header-content">
              <div className="eperf-chat-avatar">
                <img 
                  src="/icon-192.png" 
                  alt="ePerformance" 
                  style={{width: '40px', height: '40px', borderRadius: '50%'}}
                />
              </div>
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
          
          <div className="eperf-chat-body">
            <DeepChat
              style={{width: '100%', height: '100%'}}
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
                // Format messages pour l'API ePerformance
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
                // Transformer la réponse de l'API
                if (response.html) {
                  return {html: response.html};
                }
                return response;
              }}
              introMessage={{
                text: "Bonjour ! 👋\n\nJe suis l'assistant IA ePerformance.\n\nJe peux vous aider à développer votre business avec des stratégies d'acquisition rentables.\n\nComment puis-je vous aider ?"
              }}
              messageStyles={{
                default: {
                  shared: {
                    bubble: {
                      maxWidth: '85%',
                      borderRadius: '16px',
                      padding: '12px 16px',
                      fontSize: '0.9375rem',
                      lineHeight: '1.5'
                    }
                  },
                  user: {
                    bubble: {
                      backgroundColor: '#c9a96e',
                      color: '#0a0a0e',
                      marginLeft: 'auto'
                    }
                  },
                  ai: {
                    bubble: {
                      backgroundColor: '#14141a',
                      color: '#edeae3',
                      border: '1px solid #1c1c22'
                    }
                  }
                }
              }}
              textInput={{
                placeholder: {
                  text: 'Tapez votre message...',
                  style: {
                    color: '#7a7a85'
                  }
                },
                styles: {
                  container: {
                    backgroundColor: '#0c0c10',
                    border: '1px solid #1c1c22',
                    borderRadius: '12px',
                    padding: '10px 16px'
                  },
                  text: {
                    color: '#edeae3',
                    fontSize: '0.9375rem'
                  }
                }
              }}
              submitButtonStyles={{
                submit: {
                  container: {
                    default: {
                      backgroundColor: '#c9a96e',
                      borderRadius: '10px',
                      padding: '8px 12px'
                    },
                    hover: {
                      backgroundColor: '#e2c07a'
                    }
                  },
                  svg: {
                    content: '→',
                    styles: {
                      default: {
                        filter: 'brightness(0.2)'
                      }
                    }
                  }
                }
              }}
              onNewMessage={handleNewMessage}
            />
          </div>
          
          <div className="eperf-chat-footer">
            <img 
              src="/logo-ep-noir.png" 
              alt="ePerformance" 
              style={{height: '20px', opacity: '0.7'}}
            />
          </div>
        </div>
      )}
    </div>
  );
}
