import React, { useState } from 'react';
import { ArrowUpRight, ArrowUp, ArrowDown, CreditCard, ShieldAlert, Check } from 'lucide-react';

export function RightColumnCards({ metrics, alert, onTriggerAlert, onViewAnalytics }) {
  const [actionNotice, setActionNotice] = useState(null);

  const handleAction = (type) => {
    setActionNotice(type === 'send' ? 'Initiated UPI IMPS transfer test' : 'Listening on Virtual VPA rail');
    setTimeout(() => setActionNotice(null), 3000);
  };

  // Wave path generator
  const width = 280;
  const height = 75;
  const points = [
    { x: 0, y: 50 },
    { x: 35, y: 48 },
    { x: 70, y: 20 },
    { x: 105, y: 55 },
    { x: 140, y: 22 },
    { x: 175, y: 58 },
    { x: 210, y: 35 },
    { x: 245, y: 45 },
    { x: 280, y: 22 }
  ];

  let d = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const cx = (p1.x + p2.x) / 2;
    d += ` C ${cx},${p1.y} ${cx},${p2.y} ${p2.x},${p2.y}`;
  }
  const areaD = `${d} L 280,${height} L 0,${height} Z`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Card 1: Payment Goal with Wave Chart & Indian Rupee */}
      <div className="quixotic-card">
        <div className="card-header-quixotic">
          <div className="card-title-block">
            <span className="card-main-title">Payment Goal</span>
            <span className="card-sub-title">Total UPI settlement goal</span>
          </div>
          <button 
            className="card-corner-arrow-btn" 
            aria-label="Details"
            onClick={onViewAnalytics}
          >
            <ArrowUpRight size={16} />
          </button>
        </div>

        <div className="wave-chart-card-top">
          <span className="balance-caption-muted">Total Available Balance</span>
          <div className="balance-headline-large tabular-nums">
            ₹ 32,678.90
          </div>
        </div>

        {/* Wave SVG Area Chart */}
        <div className="wave-svg-container">
          <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
            <defs>
              <linearGradient id="waveGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0C7A53" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#0C7A53" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path d={areaD} fill="url(#waveGrad)" />
            <path d={d} fill="none" stroke="#0C7A53" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </div>

        {/* Send and Receive Pill Buttons */}
        <div className="two-btn-pill-row">
          <button className="btn-pill-solid-dark" onClick={() => handleAction('send')}>
            <span>Pay UPI</span>
            <ArrowUp size={14} />
          </button>
          <button className="btn-pill-outline-light" onClick={() => handleAction('receive')}>
            <span>Collect</span>
            <ArrowDown size={14} />
          </button>
        </div>

        {actionNotice && (
          <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--accent-primary)', textAlign: 'center', fontWeight: 600 }}>
            {actionNotice}
          </div>
        )}
      </div>

      {/* Card 2: Amount of Credit with Indian Rupee */}
      <div className="quixotic-card">
        <div className="card-header-quixotic" style={{ marginBottom: 8 }}>
          <div className="card-title-block">
            <span className="card-main-title" style={{ gap: '6px' }}>
              <CreditCard size={17} style={{ color: 'var(--text-secondary)' }} />
              Amount of Credit Limit
            </span>
            <span className="card-sub-title">Total refund & overdraft pool</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
          <div style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }} className="tabular-nums">
            ₹ 8,945.89
          </div>
          <span className="mint-badge-pill tabular-nums">
            +12.8%
          </span>
        </div>
      </div>

      {/* Card 3: Mandatory Payments & Monitored Avatars */}
      <div className="quixotic-card">
        <div className="card-header-quixotic" style={{ marginBottom: 8 }}>
          <div className="card-title-block">
            <span className="card-main-title">Mandatory UPI Rails</span>
            <span className="card-sub-title">Active risk officers online</span>
          </div>
          <button 
            className="card-corner-arrow-btn" 
            aria-label="View payments"
            onClick={onViewAnalytics}
          >
            <ArrowUpRight size={16} />
          </button>
        </div>

        {/* Overlapping User Avatars Row */}
        <div className="avatar-overlap-row">
          <div className="circle-user-avatar" style={{ backgroundColor: '#F3B431' }} title="David Miller (Audit)">
            DM
          </div>
          <div className="circle-user-avatar" style={{ backgroundColor: '#D97736' }} title="Sarah Connor (Risk)">
            SC
          </div>
          <div className="circle-user-avatar" style={{ backgroundColor: '#E06243' }} title="Michael Lee (Ops)">
            ML
          </div>
          <div className="circle-user-avatar" style={{ backgroundColor: '#3B82F6' }} title="Priya Sharma (UPI Lead)">
            PS
          </div>
          <div className="avatar-count-badge">
            +2
          </div>
        </div>

        {/* Threat Alert Pill */}
        {alert && (
          <div 
            onClick={onTriggerAlert}
            style={{
              marginTop: '14px',
              padding: '8px 12px',
              borderRadius: '12px',
              backgroundColor: 'var(--color-danger-bg)',
              color: 'var(--color-danger)',
              fontSize: '11.5px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <ShieldAlert size={15} style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {alert.title || 'First-time payee detected with active call'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
