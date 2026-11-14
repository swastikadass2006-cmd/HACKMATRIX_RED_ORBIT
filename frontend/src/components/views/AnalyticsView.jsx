import React, { useState } from 'react';
import { ArrowLeft, BarChart2, ShieldAlert, Zap, TrendingUp } from 'lucide-react';

export function AnalyticsView({ metrics, onBackToDashboard }) {
  const [timeframe, setTimeframe] = useState('24h');

  const riskData = [
    { label: 'Low Risk', pct: 72.0, count: '17,841', color: '#0C7A53' },
    { label: 'Medium Risk', pct: 19.0, count: '4,708', color: '#D98218' },
    { label: 'High Risk', pct: 9.0, count: '2,231', color: '#DA3A49' }
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
              Risk Analytics & Performance Reports
            </h2>
          </div>

          <div className="chart-toggle-group">
            {['24h', '7d', '30d'].map((t) => (
              <button
                key={t}
                className={`chart-toggle-btn ${timeframe === t ? 'active' : ''}`}
                onClick={() => setTimeframe(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '20px' }}>
        {/* Analytics Card */}
        <div className="quixotic-card">
          <div className="card-header-quixotic">
            <div className="card-title-block">
              <span className="card-main-title" style={{ gap: '6px' }}>
                <TrendingUp size={16} style={{ color: 'var(--accent-primary)' }} />
                Real-Time UPI Volume Evaluation ({timeframe})
              </span>
              <span className="card-sub-title">Successful vs. Flagged Transactions</span>
            </div>
          </div>

          {/* Activity Visual */}
          <div style={{ height: '240px', display: 'flex', alignItems: 'flex-end', gap: '20px', padding: '20px 0 10px', justifyContent: 'space-around' }}>
            {[
              { time: '12AM', succ: 48, flag: 6 },
              { time: '4AM', succ: 39, flag: 5 },
              { time: '8AM', succ: 89, flag: 8 },
              { time: '12PM', succ: 68, flag: 9 },
              { time: '4PM', succ: 82, flag: 10 },
              { time: '8PM', succ: 126, flag: 14 },
              { time: '12AM', succ: 78, flag: 8 },
            ].map((pt, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1 }}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end', height: '170px' }}>
                  <div 
                    style={{ 
                      width: '18px', 
                      height: `${(pt.succ / 130) * 160}px`, 
                      backgroundColor: 'var(--accent-primary)', 
                      borderRadius: '8px' 
                    }} 
                    title={`Successful: ${pt.succ * 100}`}
                  />
                  <div 
                    style={{ 
                      width: '14px', 
                      height: `${(pt.flag / 130) * 160}px`, 
                      backgroundColor: 'var(--color-danger)', 
                      borderRadius: '8px' 
                    }} 
                    title={`Flagged: ${pt.flag * 100}`}
                  />
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>{pt.time}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '14px', fontSize: '12px', fontWeight: 600 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--accent-primary)' }} />
              Successful Volume (₹ 2.45 Cr)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--color-danger)' }} />
              Blocked Threat Volume (₹ 4.82 Lakhs)
            </span>
          </div>
        </div>

        {/* Risk Distribution Card */}
        <div className="quixotic-card">
          <div className="card-header-quixotic">
            <div className="card-title-block">
              <span className="card-main-title" style={{ gap: '6px' }}>
                <ShieldAlert size={16} style={{ color: 'var(--accent-primary)' }} />
                Risk Classification Ratio
              </span>
              <span className="card-sub-title">Real-time dynamic engine partition</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '10px' }}>
            {riskData.map((r) => (
              <div key={r.label} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', fontWeight: 600 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: r.color }} />
                    {r.label}
                  </span>
                  <span className="tabular-nums" style={{ color: r.color, fontWeight: 700 }}>
                    {r.pct}% ({r.count} txns)
                  </span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${r.pct}%`, height: '100%', backgroundColor: r.color, borderRadius: '4px' }} />
                </div>
              </div>
            ))}

            <div style={{ marginTop: '16px', padding: '14px', borderRadius: '14px', backgroundColor: 'var(--accent-mint-light)', border: '1px solid var(--accent-mint-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)', fontWeight: 700, fontSize: '13px' }}>
                <Zap size={16} />
                <span>Scoring Latency SLA: 128 ms</span>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Sub-200ms latency standard enforced across 100% of incoming NPCI IMPS/UPI webhook requests.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
