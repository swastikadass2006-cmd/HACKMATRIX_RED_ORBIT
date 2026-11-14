import React from 'react';

export function LoadingSkeleton({ rows = 5 }) {
  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          style={{
            height: '32px',
            borderRadius: '6px',
            backgroundColor: '#ECE9F7',
            animation: 'pulse 1.5s ease-in-out infinite'
          }}
        />
      ))}
    </div>
  );
}

export function EmptyState({ message = 'No transactions found matching your criteria.' }) {
  return (
    <div style={{ padding: '36px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
      <p style={{ fontSize: '14px', fontWeight: 500 }}>{message}</p>
    </div>
  );
}
