import React from 'react';

export function StatusBadge({ decision }) {
  const normalized = (decision || '').toLowerCase();
  
  if (normalized === 'approved') {
    return (
      <span className="decision-badge approved">
        Approved
      </span>
    );
  }
  if (normalized === 'blocked') {
    return (
      <span className="decision-badge blocked">
        Blocked
      </span>
    );
  }
  return (
    <span className="decision-badge step-up">
      Step-up
    </span>
  );
}