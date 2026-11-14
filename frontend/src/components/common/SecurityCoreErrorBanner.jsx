import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export function SecurityCoreErrorBanner({ 
  message = "Unable to connect to Security Core", 
  onRetry 
}) {
  return (
    <div 
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 18px',
        borderRadius: '16px',
        backgroundColor: 'var(--color-danger-bg)',
        border: '1px solid var(--color-danger-border)',
        color: 'var(--color-danger)',
        fontSize: '13px',
        fontWeight: 600,
        boxShadow: 'var(--shadow-subtle)',
        marginBottom: '16px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <AlertTriangle size={18} style={{ flexShrink: 0 }} />
        <span>{message}</span>
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 12px',
            borderRadius: '9999px',
            backgroundColor: 'var(--color-danger)',
            color: 'var(--text-inverse)',
            border: 'none',
            fontSize: '11.5px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'opacity 0.15s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          <RefreshCw size={12} />
          <span>Retry Connection</span>
        </button>
      )}
    </div>
  );
}