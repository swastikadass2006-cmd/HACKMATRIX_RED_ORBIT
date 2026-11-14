import React from 'react';

export function StatusBadge({ decision }) {
  const normalized = (decision || '').toLowerCase();
  
  if (normalized === 'approved') {
    return (
      <span className="decision-badge approved">
        <span className="status-dot connected" style={{ width: 6, height: 6 }} />
        Approved
      </span>
    );
  }
  if (normalized === 'blocked') {
    return (
      <span className="decision-badge blocked">
        <span className="status-dot disconnected" style={{ width: 6, height: 6 }} />
        Blocked
      </span>
    );
  }
  return (
    <span className="decision-badge step-up">
      <span className="status-dot" style={{ width: 6, height: 6, backgroundColor: '#F2A629' }} />
      Step-up
    </span>
  );
}
