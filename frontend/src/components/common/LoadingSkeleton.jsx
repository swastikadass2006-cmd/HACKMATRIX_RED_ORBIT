import React from 'react';

export function LoadingSkeleton({ rows = 5 }) {
  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          style={{
            height: '28px',
            borderRadius: '4px',
            backgroundColor: '#F1F5F9'
          }}
        />
      ))}
    </div>
  );
}

export function EmptyState({ message = 'No transactions found matching your criteria.' }) {
  return (
    <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
      <p style={{ fontSize: '13px', fontWeight: 400 }}>{message}</p>
    </div>
  );
}
