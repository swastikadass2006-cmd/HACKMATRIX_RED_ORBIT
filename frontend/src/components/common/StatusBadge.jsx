import React from 'react';

export function StatusBadge({ decision }) {
  const normalized = (decision || '').toLowerCase();
  
  if (normalized === 'approved') {
    return (
      <span className="decision-badge approved">
        <span className="status-dot connected" />
        Approved
      </span>
    );
  }
  if (normalized === 'blocked') {
    return (
      <span className="decision-badge blocked">
        <span className="status-dot disconnected" />
        Blocked
      </span>
    );
  }
  return (
    <span className="decision-badge step-up">
      <span className="status-dot" style={{ backgroundColor: 'var(--color-warning)' }} />
      Step-up
    </span>
  );
}
