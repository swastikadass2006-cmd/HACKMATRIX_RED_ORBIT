import React from 'react';
import { AlertCircle, ChevronRight } from 'lucide-react';

export function RecentAlerts({ alerts = [], onAlertClick }) {
  const topAlert = alerts[0] || {
    id: 'alt_1',
    title: 'Recent alert',
    description: 'First-time payee detected with active call',
    timestamp: '10:41'
  };

  return (
    <div
      className="alert-item-container"
      onClick={() => onAlertClick?.(topAlert)}
    >
      <div className="alert-icon-box">
        <AlertCircle size={16} strokeWidth={1.5} />
      </div>

      <div className="alert-content-box">
        <div className="alert-title-row">
          <span className="alert-title-text">Recent alert</span>
          <span className="alert-time-text tabular-nums" style={{ fontFamily: 'var(--font-mono)' }}>
            {topAlert.timestamp}
          </span>
        </div>
        <p className="alert-desc-text">{topAlert.description}</p>
      </div>

      <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
    </div>
  );
}
