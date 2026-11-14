import React from 'react';
import { ArrowLeft, ShieldAlert, CheckCircle, Clock } from 'lucide-react';
import { ContextualEmptyState } from '../common/ContextualEmptyState';

export function AlertsView({ alerts = [], onBackToDashboard }) {
  const alertList = alerts || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
      {/* Top Header */}
      <div className="quixotic-card" style={{ padding: '16px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              className="pill-action-btn"
              onClick={onBackToDashboard}
              style={{ padding: '6px 14px', fontSize: '12px' }}
            >
              <ArrowLeft size={14} />
              <span>Back to Dashboard</span>
            </button>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Security Threat Alerts & Incident Log
            </h2>
          </div>
        </div>
      </div>

      {/* Alert Cards List */}
      <div className="quixotic-card">
        {alertList.length === 0 ? (
          <ContextualEmptyState 
            message="Zero unresolved high-risk security findings detected."
            subtext="Telemetry index will populate as target analyses conclude."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {alertList.map((a) => {
              const isHigh = a.severity === 'high';
              const isWarn = a.severity === 'warning';
              const badgeBg = isHigh ? 'var(--color-danger-bg)' : isWarn ? 'var(--color-warning-bg)' : 'var(--accent-mint-light)';
              const badgeColor = isHigh ? 'var(--color-danger)' : isWarn ? 'var(--color-warning)' : 'var(--accent-primary)';

              return (
                <div
                  key={a.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 18px',
                    borderRadius: '16px',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-light)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div 
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        backgroundColor: badgeBg,
                        color: badgeColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <ShieldAlert size={18} />
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {a.title}
                        </span>
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {a.description}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    <Clock size={12} />
                    <span>{a.timestamp}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
