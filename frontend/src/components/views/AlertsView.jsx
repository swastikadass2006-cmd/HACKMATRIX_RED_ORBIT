import React from 'react';
import { ArrowLeft, ShieldAlert, CheckCircle, Clock } from 'lucide-react';

export function AlertsView({ alerts = [], onBackToDashboard }) {
  const alertList = alerts.length > 0 ? alerts : [
    {
      id: 'alt_1',
      severity: 'high',
      title: 'First-time payee detected with active call',
      description: 'Coercion indicator: Active GSM audio stream during ₹2,300 transfer to food@ybl',
      timestamp: '10:41 AM'
    },
    {
      id: 'alt_2',
      severity: 'warning',
      title: 'Micro-split burst pattern detected',
      description: '4 transactions < ₹500 within 45 seconds from single device fingerprint',
      timestamp: '10:38 AM'
    },
    {
      id: 'alt_3',
      severity: 'high',
      title: 'Blacklisted digital mule destination',
      description: 'NPCI high-risk account hit for txn_73913 (₹49,999.00)',
      timestamp: '10:36 AM'
    },
    {
      id: 'alt_4',
      severity: 'info',
      title: 'Dynamic threshold policy synchronized',
      description: 'Block threshold set to 75, Step-up threshold set to 40',
      timestamp: '10:15 AM'
    }
  ];

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
                      <span 
                        style={{
                          fontSize: '10.5px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          backgroundColor: badgeBg,
                          color: badgeColor,
                          textTransform: 'uppercase'
                        }}
                      >
                        {a.severity}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {a.description}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={13} />
                    {a.timestamp}
                  </span>
                  <button
                    className="pill-action-btn"
                    style={{ padding: '6px 12px', fontSize: '11px' }}
                    onClick={() => alert(`Remediating incident ${a.id}`)}
                  >
                    Acknowledge
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
