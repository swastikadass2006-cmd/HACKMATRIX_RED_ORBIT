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
      <div style={{ lineHeight: 1.5, fontSize: '13px' }}>
        {lines.map((line, idx) => {
          // Headers
          if (line.startsWith('### ')) {
            return (
              <h4 key={idx} style={{ margin: '8px 0 4px', fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                {line.replace('### ', '')}
              </h4>
            );
          }
          if (line.startsWith('## ')) {
            return (
              <h3 key={idx} style={{ margin: '10px 0 6px', fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
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
        return <strong key={i} style={{ color: '#0F172A' }}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} style={{ 
            backgroundColor: '#F1F5F9', 
            padding: '2px 5px', 
            borderRadius: '4px', 
            fontSize: '11px',
            fontFamily: 'monospace',
            color: '#0F766E'
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
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    boxShadow: '0 20px 50px rgba(15, 23, 42, 0.22), 0 4px 12px rgba(15, 23, 42, 0.1)',
    border: '1.5px solid #CBD5E1',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    zIndex: 9999,
    transition: 'all 0.25s ease'
  } : {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid var(--border-card)',
    boxShadow: 'var(--shadow-card)',
    overflow: 'hidden',
    minHeight: '600px'
  };

  return (
    <div style={containerStyle}>
      {/* Top Header Bar */}
      <div style={{
        padding: '12px 16px',
        backgroundColor: '#0F172A',
        color: '#F8FAFC',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #334155'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: 'rgba(56, 189, 248, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#38BDF8',
            border: '1px solid rgba(56, 189, 248, 0.3)'
          }}>
            <Bot size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#F8FAFC' }}>
                ShieldPay Security Copilot
              </span>
              <span style={{
                fontSize: '9px',
                fontWeight: 800,
                padding: '2px 5px',
                borderRadius: '4px',
                backgroundColor: '#0369A1',
                color: '#E0F2FE'
              }}>
                Gemini 3.5
              </span>
            </div>
            <span style={{ fontSize: '11px', color: '#94A3B8' }}>
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
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px'
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
                color: '#94A3B8',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px'
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
                color: '#94A3B8',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px'
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
              padding: '8px 12px',
              backgroundColor: '#FEF3C7',
              borderBottom: '1px solid #FDE68A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                <AlertTriangle size={14} style={{ color: '#D97706', flexShrink: 0 }} />
                <span style={{ color: '#92400E', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Context: <strong>{activeContext.url}</strong> (Score: {activeContext.risk_score}/100)
                </span>
              </div>
              <button
                onClick={() => setActiveContext(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#B45309',
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
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            backgroundColor: '#F8FAFC'
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
                    padding: '10px 14px',
                    borderRadius: isUser ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                    backgroundColor: isUser ? '#0C7A53' : '#FFFFFF',
                    color: isUser ? '#FFFFFF' : '#1E293B',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                    border: isUser ? 'none' : '1px solid #E2E8F0',
                    wordBreak: 'break-word'
                  }}>
                    {isUser ? (
                      <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.4 }}>{m.content}</p>
                    ) : (
                      renderFormattedContent(m.content)
                    )}
                  </div>

                  {/* Metadata line */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginTop: '3px',
                    fontSize: '10px',
                    color: '#94A3B8'
                  }}>
                    <span>{m.timestamp}</span>
                    {m.model && (
                      <span>• {m.is_fallback ? 'Offline Sentinel' : m.model}</span>
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
                padding: '8px 14px',
                borderRadius: '12px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                alignSelf: 'flex-start',
                fontSize: '12px',
                color: '#64748B'
              }}>
                <RefreshCw size={14} className="animate-spin" style={{ color: 'var(--accent-primary)' }} />
                <span>AI Security Copilot analyzing context...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestion Chips */}
          <div style={{
            padding: '8px 12px',
            backgroundColor: '#FFFFFF',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            whiteSpace: 'nowrap'
          }}>
            {SUGGESTION_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(chip)}
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '4px 10px',
                  borderRadius: '12px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#F8FAFC',
                  color: '#334155',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input & Send Bar */}
          <div style={{
            padding: '12px 14px',
            backgroundColor: '#FFFFFF',
            borderTop: '1px solid #E2E8F0'
          }}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              style={{ display: 'flex', gap: '8px' }}
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about URLs, phishing, or cooling locks..."
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid #CBD5E1',
                  fontSize: '13px',
                  outline: 'none',
                  backgroundColor: '#F8FAFC'
                }}
              />
              <button
                type="submit"
                disabled={loading || !inputValue.trim()}
                style={{
                  backgroundColor: '#0C7A53',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: loading || !inputValue.trim() ? 'not-allowed' : 'pointer',
                  opacity: loading || !inputValue.trim() ? 0.6 : 1
                }}
              >
                <Send size={15} />
              </button>
            </form>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '10px', color: '#94A3B8' }}>
              <span>Strict Rule: ShieldPay will never ask for your UPI PIN.</span>
              {onNavigateToScanner && (
                <button
                  type="button"
                  onClick={onNavigateToScanner}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#0C7A53',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '10px',
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
