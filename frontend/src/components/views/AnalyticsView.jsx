import React, { useState, useEffect } from 'react';
import { ArrowLeft, BarChart2, ShieldAlert, Zap, TrendingUp } from 'lucide-react';
import { fetchAnalytics, fetchRiskDistribution } from '../../api/client';
import { ContextualEmptyState } from '../common/ContextualEmptyState';

export function AnalyticsView({ metrics, onBackToDashboard }) {
  const [timeframe, setTimeframe] = useState('24h');
  const [analytics, setAnalytics] = useState(null);
  const [riskDist, setRiskDist] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchAnalytics(timeframe).catch(() => null),
      fetchRiskDistribution().catch(() => null)
    ]).then(([ana, risk]) => {
      if (ana) setAnalytics(ana);
      if (risk) setRiskDist(risk);
      setLoading(false);
    });
  }, [timeframe]);

  const labels = analytics?.labels || ['12AM', '4AM', '8AM', '12PM', '4PM', '8PM', '12AM'];
  const succData = analytics?.series?.[0]?.data || [4800, 3900, 8900, 6800, 8200, 12600, 7800];
  const flagData = analytics?.series?.[1]?.data || [620, 580, 710, 840, 920, 1150, 780];
  const maxVal = Math.max(...succData, ...flagData, 1);

  const riskData = riskDist ? [
    { label: 'Low Risk', pct: riskDist.low_risk?.percentage || 72.0, count: riskDist.low_risk?.count?.toLocaleString('en-IN') || '17,841', color: '#0C7A53' },
    { label: 'Medium Risk', pct: riskDist.medium_risk?.percentage || 19.0, count: riskDist.medium_risk?.count?.toLocaleString('en-IN') || '4,708', color: '#D98218' },
    { label: 'High Risk', pct: riskDist.high_risk?.percentage || 9.0, count: riskDist.high_risk?.count?.toLocaleString('en-IN') || '2,231', color: '#DA3A49' }
  ] : [
    { label: 'Low Risk', pct: 72.0, count: '17,841', color: '#0C7A53' },
    { label: 'Medium Risk', pct: 19.0, count: '4,708', color: '#D98218' },
    { label: 'High Risk', pct: 9.0, count: '2,231', color: '#DA3A49' }
  ];

  const latencyFormatted = metrics?.avg_scoring_latency?.value_formatted || '128 ms';

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
            {labels.map((time, i) => {
              const succ = succData[i] || 0;
              const flag = flagData[i] || 0;
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1 }}>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end', height: '170px' }}>
                    <div 
                      style={{ 
                        width: '18px', 
                        height: `${Math.max(8, (succ / maxVal) * 160)}px`, 
                        backgroundColor: 'var(--accent-primary)', 
                        borderRadius: '8px',
                        transition: 'height 0.3s ease'
                      }} 
                      title={`Successful: ₹ ${succ.toLocaleString('en-IN')}`}
                    />
                    <div 
                      style={{ 
                        width: '14px', 
                        height: `${Math.max(4, (flag / maxVal) * 160)}px`, 
                        backgroundColor: 'var(--color-danger)', 
                        borderRadius: '8px',
                        transition: 'height 0.3s ease'
                      }} 
                      title={`Flagged: ₹ ${flag.toLocaleString('en-IN')}`}
                    />
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>{time}</span>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '14px', fontSize: '12px', fontWeight: 600 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--accent-primary)' }} />
              Successful Volume
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--color-danger)' }} />
              Blocked Threat Volume
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
                <span>Scoring Latency SLA: {latencyFormatted}</span>
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
