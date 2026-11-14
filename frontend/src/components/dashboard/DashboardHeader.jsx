import React from 'react';
import { ShieldCheck } from 'lucide-react';

export function DashboardHeader({ timeframe = '24h', onTimeframeChange }) {
  const TIMEFRAME_OPTIONS = [
    { id: '24h', label: '24 Hours' },
    { id: '7d', label: '7 Days' },
    { id: '30d', label: '30 Days' }
  ];

  return (
    <div className="dashboard-header-container">
      <div>
        <h1 className="header-title">Payment operations</h1>
        <p className="header-description">
          Monitor UPI activity, review risk decisions and configure fraud controls.
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div className="timeframe-pill-group">
          {TIMEFRAME_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              className={`timeframe-pill-btn ${timeframe === opt.id ? 'active' : ''}`}
              onClick={() => onTimeframeChange?.(opt.id)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
