import React from 'react';
import { ShieldCheck, Inbox, Activity, RefreshCw } from 'lucide-react';

export function ContextualEmptyState({ 
  message = "No investigations recorded in current operational session.",
  subtext,
  icon: Icon = ShieldCheck,
  actionText,
  onAction,
  style = {}
}) {
  return (
    <div 
      className="contextual-empty-state"
      role="status"
      aria-live="polite"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '36px 20px',
        textAlign: 'center',
        borderRadius: '16px',
        backgroundColor: 'var(--bg-secondary)',
        border: '1px dashed var(--border-light)',
        width: '100%',
        minHeight: '140px',
        ...style
      }}
    >
      <div 
        style={{
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          backgroundColor: 'var(--bg-surface)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--accent-primary)',
          boxShadow: 'var(--shadow-subtle)',
          marginBottom: '10px'
        }}
      >
        <Icon size={18} strokeWidth={2} />
      </div>

      <p 
        style={{
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--text-primary)',
          maxWidth: '340px',
          lineHeight: 1.4,
          margin: 0
        }}
      >
        {message}
      </p>

      {subtext && (
        <p 
          style={{
            fontSize: '11.5px',
            color: 'var(--text-secondary)',
            marginTop: '4px',
            maxWidth: '300px'
          }}
        >
          {subtext}
        </p>
      )}

      {actionText && onAction && (
        <button 
          onClick={onAction}
          className="pill-action-btn"
          style={{ marginTop: '12px', padding: '6px 14px', fontSize: '11.5px' }}
        >
          <RefreshCw size={12} />
          <span>{actionText}</span>
        </button>
      )}
    </div>
  );
}