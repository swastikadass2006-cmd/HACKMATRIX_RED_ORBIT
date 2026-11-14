import React from 'react';
import { AlertCircle, ChevronRight } from 'lucide-react';

export function RecentAlerts({ alerts = [], onAlertClick }) {
  const topAlert = alerts[0] || {
    id: 'alt_1',
    title: 'Recent alert',
    description: 'First-time payee detected with active call',
    timestamp: '10:41 AM'
  };

  return (
    <div
      className="alert-item-container"
      onClick={() => onAlertClick?.(topAlert)}
    >
      <div className="alert-icon-box">
        <AlertCircle size={18} />
      </div>

      <div className="alert-content-box">
        <div className="alert-title-row">
          <span className="alert-title-text">Recent alert</span>
          <span className="alert-time-text tabular-nums">{topAlert.timestamp}</span>
        </div>
        <p className="alert-desc-text">{topAlert.description}</p>
      </div>

      <ChevronRight size={16} style={{ color: 'var(--color-danger)', opacity: 0.8 }} />
    </div>
  );
}
