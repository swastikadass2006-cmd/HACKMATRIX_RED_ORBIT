import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Send, 
  X, 
  Minimize2, 
  Maximize2, 
  Sparkles, 
  AlertTriangle, 
  ShieldCheck, 
  RefreshCw, 
  Trash2,
  ExternalLink,
  ChevronRight,
  Shield
} from 'lucide-react';
import { sendAiChat } from '../api/client';

export function AiSecurityAssistant({ 
  isOpen = false, 
  onClose, 
  isFloating = true,
  initialContext = null,
  onNavigateToScanner
}) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: "👋 Hello! I am your **ShieldPay & TrustLens AI Security Assistant**.\n\nI monitor UPI payment rails, analyze suspicious URLs and phishing threats with our XGBoost & SHAP models, and guide you through Cooling Locks and Guardian approvals.\n\nHow can I help you stay secure today?",
      model: 'gemini-3.5-flash-lite',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeContext, setActiveContext] = useState(initialContext);
  const [isMinimized, setIsMinimized] = useState(false);
  const [errorNotice, setErrorNotice] = useState(null);
  const messagesEndRef = useRef(null);

  // Update context when passed new initialContext
  useEffect(() => {
    if (initialContext) {
      setActiveContext(initialContext);
      // Auto-insert a system message highlighting the new context
      const contextMsg = {
        id: 'ctx-' + Date.now(),
        role: 'assistant',
        content: `🔍 **TrustLens Threat Loaded:**\n\n- **Target:** \`${initialContext.url}\`\n- **Verdict:** **${initialContext.verdict || 'ANALYZED'}** (Risk Score: **${initialContext.risk_score || 0}/100**)\n${initialContext.is_impersonating ? `- ⚠️ **Spoofing Alert:** Impersonating ${initialContext.target_brand}\n` : ''}\nWould you like me to explain the risk factors or give you recommended safety actions?`,
        model: 'system-context',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, contextMsg]);
    }
  }, [initialContext]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend) => {
    const query = textToSend || inputValue;
    if (!query.trim() || loading) return;

    const userMsg = {
      id: 'u-' + Date.now(),
      role: 'user',
      content: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setLoading(true);
    setErrorNotice(null);

    // Build chat history for GenAI SDK
    const historyPayload = messages.slice(-6).map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      content: m.content
    }));

    try {
      const res = await sendAiChat({
        message: query.trim(),
        history: historyPayload,
        context: activeContext || undefined,
        lang: 'en'
      });

      const assistantMsg = {
        id: 'a-' + Date.now(),
        role: 'assistant',
        content: res.response,
        model: res.model,
        is_fallback: res.is_fallback,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setErrorNotice(err.message || 'Chat service temporarily unavailable.');
      // Add local emergency response
      const fallbackMsg = {
        id: 'a-err-' + Date.now(),
        role: 'assistant',
        content: "⚠️ **Security Sentinel Alert**: Communication with the cloud AI endpoint timed out.\n\n**Standard ShieldPay Advice:**\n- Never share your 4/6-digit UPI PIN with anyone.\n- Receiving funds on UPI **never** requires entering your PIN.\n- If you suspect fraud, activate the 20-second Remorse Cancel or enable Guardian Mode.",
        model: 'offline-emergency-sentinel',
        is_fallback: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        role: 'assistant',
        content: "Chat session cleared. How can I assist you with ShieldPay transaction security or TrustLens threat analysis?",
        model: 'gemini-3.5-flash-lite',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setActiveContext(null);
    setErrorNotice(null);
  };

  const SUGGESTION_CHIPS = [
    "Why was this link flagged?",
    "Explain the 20-second Cooling Lock",
    "How does Guardian Mode co-signing work?",
    "Do I ever need a PIN to receive money?"
  ];

  // Helper to format basic markdown (bold, code, lists)
  const renderFormattedContent = (content) => {
    const lines = content.split('\n');
    return (
      <div style={{ lineHeight: 1.6, fontSize: '13.5px', color: 'var(--text-primary)' }}>
        {lines.map((line, idx) => {
          // Headers
          if (line.startsWith('### ')) {
            return (
              <h4 key={idx} style={{ margin: '8px 0 4px', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {line.replace('### ', '')}
              </h4>
            );
          }
          if (line.startsWith('## ')) {
            return (
              <h3 key={idx} style={{ margin: '10px 0 6px', fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {line.replace('## ', '')}
              </h3>
            );
          }
          // Bullet points
          if (line.startsWith('- ') || line.startsWith('* ')) {
            return (
              <div key={idx} style={{ display: 'flex', gap: '6px', margin: '3px 0', paddingLeft: '4px' }}>
                <span style={{ color: 'var(--accent-primary)', fontWeight: 800 }}>•</span>
                <span>{renderInlineFormatting(line.substring(2))}</span>
              </div>
            );
          }
          // Numbered lists
          const numMatch = line.match(/^(\d+)\.\s(.*)/);
          if (numMatch) {
            return (
              <div key={idx} style={{ display: 'flex', gap: '6px', margin: '3px 0', paddingLeft: '4px' }}>
                <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>{numMatch[1]}.</span>
                <span>{renderInlineFormatting(numMatch[2])}</span>
              </div>
            );
          }
          // Blank line
          if (!line.trim()) {
            return <div key={idx} style={{ height: '6px' }} />;
          }
          // Regular line
          return <p key={idx} style={{ margin: '3px 0' }}>{renderInlineFormatting(line)}</p>;
        })}
      </div>
    );
  };

  const renderInlineFormatting = (text) => {
    // Process **bold** and `code`
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} style={{ 
            backgroundColor: 'var(--bg-secondary)', 
            padding: '2px 6px', 
            borderRadius: '4px', 
            fontSize: '11.5px',
            fontFamily: 'monospace',
            color: 'var(--accent-primary)',
            border: '1px solid var(--border-light)'
          }}>
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  if (!isOpen) return null;

  // Floating window styles vs Full View styles
  const containerStyle = isFloating ? {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    width: isMinimized ? '320px' : '420px',
    height: isMinimized ? '56px' : '620px',
    backgroundColor: 'var(--bg-surface)',
    borderRadius: '16px',
    boxShadow: 'var(--shadow-floating)',
    border: '1px solid var(--border-light)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    zIndex: 9999,
    transition: 'width 0.25s ease, height 0.25s ease'
  } : {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    backgroundColor: 'var(--bg-surface)',
    borderRadius: '16px',
    border: '1px solid var(--border-light)',
    boxShadow: 'var(--shadow-card)',
    overflow: 'hidden',
    minHeight: '600px'
  };

  return (
    <div style={containerStyle}>
      {/* Top Header Bar */}
      <div style={{
        padding: '14px 18px',
        backgroundColor: 'var(--bg-surface)',
        color: 'var(--text-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-light)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            backgroundColor: 'var(--accent-mint-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-primary)',
            border: '1.5px solid var(--accent-mint-border)'
          }}>
            <Bot size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                ShieldPay Security Copilot
              </span>
              <span style={{
                fontSize: '9.5px',
                fontWeight: 800,
                padding: '2px 6px',
                borderRadius: '4px',
                backgroundColor: 'var(--accent-mint-light)',
                color: 'var(--accent-primary)',
                border: '1px solid var(--accent-mint-border)'
              }}>
                Gemini 3.5
              </span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Active Protection & Threat Explainer
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={handleClearChat}
            title="Clear Chat History"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Trash2 size={15} />
          </button>

          {isFloating && (
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              title={isMinimized ? "Expand" : "Minimize"}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--text-primary)';
                e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {isMinimized ? <Maximize2 size={15} /> : <Minimize2 size={15} />}
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              title="Close Assistant"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--text-primary)';
                e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* When Minimized */}
      {isMinimized ? null : (
        <>
          {/* Active Threat Context Banner (if available) */}
          {activeContext && activeContext.url && (
            <div style={{
              padding: '8px 14px',
              backgroundColor: 'var(--color-warning-soft)',
              borderBottom: '1px solid var(--color-warning-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11.5px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                <AlertTriangle size={14} style={{ color: 'var(--color-warning-text)', flexShrink: 0 }} />
                <span style={{ color: 'var(--color-warning-text)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Context: <strong>{activeContext.url}</strong> (Score: {activeContext.risk_score}/100)
                </span>
              </div>
              <button
                onClick={() => setActiveContext(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-warning-text)',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '11px',
                  padding: '2px 4px'
                }}
              >
                Clear
              </button>
            </div>
          )}

          {/* Messages Scroll Area */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            backgroundColor: 'var(--bg-primary)'
          }}>
            {messages.map((m) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: '88%',
                    alignSelf: isUser ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: isUser ? '16px 16px 3px 16px' : '16px 16px 16px 3px',
                    background: isUser ? 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-dark) 100%)' : 'var(--bg-surface)',
                    color: isUser ? '#FFFFFF' : 'var(--text-primary)',
                    boxShadow: 'var(--shadow-subtle)',
                    border: isUser ? 'none' : '1px solid var(--border-light)',
                    wordBreak: 'break-word'
                  }}>
                    {isUser ? (
                      <p style={{ margin: 0, fontSize: '13.5px', lineHeight: 1.5, color: '#FFFFFF' }}>{m.content}</p>
                    ) : (
                      renderFormattedContent(m.content)
                    )}
                  </div>

                  {/* Metadata line */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginTop: '4px',
                    fontSize: '10.5px',
                    color: 'var(--text-secondary)'
                  }}>
                    <span>{m.timestamp}</span>
                    {m.model && (
                      <span>| {m.is_fallback ? 'Offline Sentinel' : m.model}</span>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                borderRadius: '14px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-light)',
                alignSelf: 'flex-start',
                fontSize: '12px',
                color: 'var(--text-secondary)'
              }}>
                <RefreshCw size={14} className="animate-spin motion-reduce:animate-none" style={{ color: 'var(--accent-primary)' }} />
                <span>AI Security Copilot analyzing threat context…</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestion Chips */}
          <div style={{
            padding: '10px 18px',
            backgroundColor: 'var(--bg-surface)',
            borderTop: '1px solid var(--border-light)',
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            whiteSpace: 'nowrap'
          }}>
            {SUGGESTION_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(chip)}
                style={{
                  fontSize: '11.5px',
                  fontWeight: 600,
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  border: '1px solid var(--border-light)',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--accent-mint-light)';
                  e.currentTarget.style.borderColor = 'var(--accent-primary)';
                  e.currentTarget.style.color = 'var(--accent-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                  e.currentTarget.style.borderColor = 'var(--border-light)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input & Send Bar */}
          <div style={{
            padding: '14px 18px',
            backgroundColor: 'var(--bg-surface)',
            borderTop: '1px solid var(--border-light)'
          }}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              style={{ display: 'flex', gap: '10px' }}
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                placeholder="Ask about URLs, phishing, or cooling locks…"
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '11px 16px',
                  borderRadius: '12px',
                  border: isInputFocused ? '1.5px solid var(--accent-primary)' : '1.5px solid var(--border-light)',
                  boxShadow: isInputFocused ? '0 0 0 3px var(--accent-glow)' : 'none',
                  fontSize: '13px',
                  outline: 'none',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontFamily: 'inherit',
                  transition: 'all 0.15s ease'
                }}
              />
              <button
                type="submit"
                disabled={loading || !inputValue.trim()}
                style={{
                  background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-dark) 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '0 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: loading || !inputValue.trim() ? 'not-allowed' : 'pointer',
                  opacity: loading || !inputValue.trim() ? 0.6 : 1,
                  boxShadow: '0 2px 10px rgba(16, 185, 129, 0.3)',
                  transition: 'all 0.15s ease'
                }}
              >
                <Send size={15} />
              </button>
            </form>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', fontSize: '10.5px', color: 'var(--text-secondary)' }}>
              <span>Strict Rule: ShieldPay will never ask for your UPI PIN.</span>
              {onNavigateToScanner && (
                <button
                  type="button"
                  onClick={onNavigateToScanner}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-primary)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '10.5px',
                    padding: 0
                  }}
                >
                  Open ML Scanner ↗
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default AiSecurityAssistant;