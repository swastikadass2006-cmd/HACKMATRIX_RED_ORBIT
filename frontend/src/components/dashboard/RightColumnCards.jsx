import React, { useState } from 'react';
import { ArrowUpRight, ArrowUp, ArrowDown, CreditCard, ShieldAlert, Check } from 'lucide-react';
import { ContextualEmptyState } from '../common/ContextualEmptyState';

export function RightColumnCards({ metrics, alert, onTriggerAlert, onViewAnalytics }) {
  const [actionNotice, setActionNotice] = useState(null);

  const handleAction = (type) => {
    setActionNotice(type === 'send' ? 'Initiated UPI IMPS transfer test' : 'Listening on Virtual VPA rail');
    setTimeout(() => setActionNotice(null), 3000);
  };

  // Wave path generator driven by live metrics sparkline
  const width = 280;
  const height = 75;
  const rawPoints = metrics?.transactions_today?.sparkline || [22100, 22800, 23400, 23900, 24200, 24500, 24780];
  const minVal = Math.min(...rawPoints);
  const maxVal = Math.max(...rawPoints);
  const range = maxVal - minVal || 1;

  const points = rawPoints.map((val, idx) => {
    const x = (idx / (rawPoints.length - 1)) * width;
    const y = height - 12 - ((val - minVal) / range) * (height - 24);
    return { x, y };
  });

  let d = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const cx = (p1.x + p2.x) / 2;
    d += ` C ${cx},${p1.y} ${cx},${p2.y} ${p2.x},${p2.y}`;
  }
  const areaD = `${d} L ${width},${height} L 0,${height} Z`;

  const availableBalance = metrics?.transactions_today?.value 
    ? `₹ ${(metrics.transactions_today.value * 1.3007).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : '₹ 32,678.90';

  const creditPool = metrics?.flagged_for_review?.value
    ? `₹ ${(metrics.flagged_for_review.value * 69.89).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : '₹ 8,945.89';

  const creditChange = metrics?.flagged_for_review?.change_percent
    ? `+${metrics.flagged_for_review.change_percent}%`
    : '+12.8%';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Card 1: Payment Goal with Wave Chart matching Image 2 */}
      <div className="quixotic-card">
        <div className="card-header-quixotic">
          <div className="card-title-block">
            <span className="card-main-title">Payment Goal</span>
            <span className="card-sub-title">Total amount goal</span>
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
          <span className="balance-caption-muted">Total Balance</span>
          <div className="balance-headline-large tabular-nums">
            $32,678.90
          </div>
        </div>

        {/* Wave SVG Area Chart */}
        <div className="wave-svg-container">
          <svg aria-hidden="true" width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
            <defs>
              <linearGradient id="waveGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.22" />
                <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path d={areaD} fill="url(#waveGrad)" />
            <path d={d} fill="none" stroke="var(--accent-primary)" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </div>

        {/* Send and Receive Pill Buttons matching Image 2 */}
        <div className="two-btn-pill-row">
          <button className="btn-pill-solid-dark" onClick={() => handleAction('send')}>
            <span>Send</span>
            <ArrowUp size={14} />
          </button>
          <button className="btn-pill-outline-light" onClick={() => handleAction('receive')}>
            <span>Receive</span>
            <ArrowDown size={14} />
          </button>
        </div>

        {actionNotice && (
          <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--accent-primary)', textAlign: 'center', fontWeight: 600 }}>
            {actionNotice}
          </div>
        )}
      </div>

      {/* Card 2: Amount of credit matching Image 2 */}
      <div className="quixotic-card" style={{ gap: '16px' }}>
        {/* Upper section: Credit Limit */}
        <div>
          <div className="card-header-quixotic" style={{ marginBottom: 6 }}>
            <div className="card-title-block">
              <span className="card-main-title" style={{ gap: '6px' }}>
                <CreditCard size={16} style={{ color: 'var(--text-secondary)' }} />
                Amount of credit
              </span>
              <span className="card-sub-title">Total refund amount with fee</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
            <div style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }} className="tabular-nums">
              $8,945.89
            </div>
            <span className="mint-badge-pill tabular-nums">
              +12.8%
            </span>
          </div>
        </div>

        {/* Subtle inner divider matching design */}
        <div style={{ height: '1px', background: 'var(--border-light)', margin: '0' }} />

        {/* Lower section: Mandatory UPI Rails */}
        <div>
          <div className="card-header-quixotic" style={{ marginBottom: 10 }}>
            <div className="card-title-block">
              <span className="card-main-title" style={{ fontSize: '14px' }}>Mandatory Payments</span>
              <span className="card-sub-title">Recent payments & co-signers</span>
            </div>
            <button 
              className="card-corner-arrow-btn" 
              aria-label="View payments"
              onClick={onViewAnalytics}
            >
              <ArrowUpRight size={15} />
            </button>
          </div>

          {/* Overlapping User Avatars Row */}
          <div className="avatar-overlap-row">
            <div className="circle-user-avatar" style={{ backgroundColor: 'var(--color-warning)' }} title="David Miller (Audit)">
              DM
            </div>
            <div className="circle-user-avatar" style={{ backgroundColor: 'var(--accent-dark)' }} title="Sarah Connor (Risk)">
              SC
            </div>
            <div className="circle-user-avatar" style={{ backgroundColor: 'var(--color-danger)' }} title="Michael Lee (Ops)">
              ML
            </div>
            <div className="circle-user-avatar" style={{ backgroundColor: 'var(--accent-primary)' }} title="Priya Sharma (UPI Lead)">
              PS
            </div>
            <div className="avatar-count-badge">
              +2
            </div>
          </div>
        </div>

        {/* Threat Alert Pill or Empty State */}
        {alert ? (
          <div 
            onClick={onTriggerAlert}
            style={{
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
              {alert.title}
            </span>
          </div>
        ) : (
          <ContextualEmptyState 
            message="Zero unresolved high-risk security findings detected."
            style={{ minHeight: '80px', padding: '12px 10px' }}
          />
        )}
      </div>
    </div>
  );
}