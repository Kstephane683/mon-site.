import React, { useState, useEffect } from 'react';
import { DeepChat } from 'deep-chat-react';
import './styles/widget.css';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  
  // Backend Railway URL
  const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:8000/api/chatbot/message'
    : 'https://web-production-4ab53.up.railway.app/api/chatbot/message';
  
  // Tooltip proactif après 5 secondes (si pas encore ouvert)
  useEffect(() => {
    if (!hasInteracted) {
      const timer = setTimeout(() => {
        setShowTooltip(true);
        // Cache le tooltip après 10 secondes
        setTimeout(() => setShowTooltip(false), 10000);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [hasInteracted]);
  
  const handleNewMessage = () => {
    if (!isOpen) {
      setUnreadCount(prev => prev + 1);
    }
  };
  
  const handleOpen = () => {
    setIsOpen(true);
    setUnreadCount(0);
    setHasInteracted(true);
    setShowTooltip(false);
  };
  
  return (
    <div className="eperf-chat-widget">
      {/* Tooltip proactif */}
      {showTooltip && !isOpen && (
        <div className="eperf-chat-tooltip">
          <div className="eperf-tooltip-content">
            👋 Besoin d'aide ?
          </div>
          <div className="eperf-tooltip-arrow"></div>
        </div>
      )}
      
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
          {/* Header avec agent personnalisé */}
          <div className="eperf-chat-header">
            <div className="eperf-chat-header-content">
              <img 
                src="/icon-eperf.png" 
                alt="Sarah - Experte Acquisition" 
                className="eperf-chat-avatar-img"
              />
              <div className="eperf-chat-header-text">
                <h3>Sarah - Experte Acquisition</h3>
                <p className="eperf-chat-status">
                  <span className="status-dot"></span>
                  En ligne · Répond en quelques minutes
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
                  <div style="padding: 0; margin-bottom: 20px;">
                    <!-- Carte d'accueil avec avatar -->
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px; padding: 24px; color: white; box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);">
                      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                        <div style="width: 48px; height: 48px; border-radius: 50%; background: white; padding: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                          <img src="/icon-eperf.png" alt="Sarah" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" />
                        </div>
                        <div>
                          <div style="font-size: 16px; font-weight: 600; margin-bottom: 4px;">Sarah - Experte Acquisition</div>
                          <div style="font-size: 13px; opacity: 0.9; display: flex; align-items: center; gap: 6px;">
                            <span style="width: 8px; height: 8px; background: #10b981; border-radius: 50%; display: inline-block;"></span>
                            En ligne maintenant
                          </div>
                        </div>
                      </div>
                      
                      <h2 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 600;">👋 Bonjour !</h2>
                      <p style="margin: 0; font-size: 15px; line-height: 1.6; opacity: 0.95;">
                        Je suis spécialisée dans l'<strong>acquisition digitale</strong> et la <strong>génération de leads</strong> pour les entreprises ambitieuses.
                      </p>
                    </div>
                    
                    <!-- Boutons d'action rapides -->
                    <div style="margin-top: 20px; display: flex; flex-direction: column; gap: 10px;">
                      <div style="font-size: 14px; font-weight: 600; color: #4b5563; margin-bottom: 4px;">
                        💡 Comment puis-je vous aider aujourd'hui ?
                      </div>
                      
                      <button class="eperf-quick-action" data-message="Je veux générer plus de leads qualifiés pour mon entreprise">
                        <span style="font-size: 20px;">🚀</span>
                        <div style="text-align: left;">
                          <div style="font-weight: 600; font-size: 14px; color: #1f2937;">Générer plus de leads</div>
                          <div style="font-size: 12px; color: #6b7280;">Augmentez votre acquisition de +40%</div>
                        </div>
                      </button>
                      
                      <button class="eperf-quick-action" data-message="J'aimerais optimiser mon CAC et améliorer ma LTV">
                        <span style="font-size: 20px;">💰</span>
                        <div style="text-align: left;">
                          <div style="font-weight: 600; font-size: 14px; color: #1f2937;">Optimiser mon CAC</div>
                          <div style="font-size: 12px; color: #6b7280;">Réduisez vos coûts d'acquisition</div>
                        </div>
                      </button>
                      
                      <button class="eperf-quick-action" data-message="Je souhaite créer un site web performant pour mon activité">
                        <span style="font-size: 20px;">🎯</span>
                        <div style="text-align: left;">
                          <div style="font-weight: 600; font-size: 14px; color: #1f2937;">Créer mon site</div>
                          <div style="font-size: 12px; color: #6b7280;">Site optimisé conversion & SEO</div>
                        </div>
                      </button>
                      
                      <button class="eperf-quick-action" data-message="Je voudrais parler à un conseiller pour discuter de mon projet">
                        <span style="font-size: 20px;">💬</span>
                        <div style="text-align: left;">
                          <div style="font-weight: 600; font-size: 14px; color: #1f2937;">Parler à un conseiller</div>
                          <div style="font-size: 12px; color: #6b7280;">Échangez avec un expert humain</div>
                        </div>
                      </button>
                    </div>
                  </div>
                  
                  <script>
                    // Gestion des clics sur les boutons quick-action
                    setTimeout(() => {
                      const buttons = document.querySelectorAll('.eperf-quick-action');
                      buttons.forEach(btn => {
                        btn.addEventListener('click', () => {
                          const message = btn.getAttribute('data-message');
                          const inputElement = document.querySelector('deep-chat').shadowRoot.querySelector('[contenteditable="true"]');
                          if (inputElement) {
                            inputElement.textContent = message;
                            // Trigger l'envoi
                            const submitBtn = document.querySelector('deep-chat').shadowRoot.querySelector('button[type="submit"]');
                            if (submitBtn) submitBtn.click();
                          }
                        });
                      });
                    }, 100);
                  </script>
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
