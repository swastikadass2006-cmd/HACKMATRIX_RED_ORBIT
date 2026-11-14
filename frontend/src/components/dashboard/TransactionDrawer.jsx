import React from 'react';
import { X, ShieldAlert, CheckCircle2, AlertTriangle, Cpu, Globe, Clock, Smartphone } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';

export function TransactionDrawer({ transaction, onClose }) {
  if (!transaction) return null;

  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val);
  };

  const isHighRisk = transaction.risk_score >= 75;
  const isMedRisk = transaction.risk_score >= 40 && transaction.risk_score < 75;

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div>
            <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
              Transaction Inspection
            </span>
            <h3 className="drawer-header-title">{transaction.id}</h3>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close drawer">
            <X size={18} />
          </button>
        </div>

        <div className="drawer-body">
          {/* Main Status & Amount Card */}
          <div className="drawer-info-card" style={{ backgroundColor: '#FAF9FE', borderColor: '#E5E1F4' }}>
            <div className="drawer-info-row">
              <span className="drawer-info-label">Evaluated Decision</span>
              <StatusBadge decision={transaction.decision} />
            </div>

            <div className="drawer-info-row">
              <span className="drawer-info-label">Transfer Amount</span>
              <span className="tabular-nums" style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {formatINR(transaction.amount)}
              </span>
            </div>

            <div className="drawer-info-row">
              <span className="drawer-info-label">Risk Classification</span>
              <span style={{ fontWeight: 600, color: isHighRisk ? '#E84658' : isMedRisk ? '#F2A629' : '#20B77A' }}>
                {transaction.classification || (isHighRisk ? 'High Risk' : isMedRisk ? 'Medium Risk' : 'Low Risk')}
              </span>
            </div>

            <div className="drawer-info-row">
              <span className="drawer-info-label">Risk Score</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '80px', height: '8px', backgroundColor: '#E2DFEE', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${transaction.risk_score}%`,
                      backgroundColor: isHighRisk ? '#E84658' : isMedRisk ? '#F2A629' : '#20B77A'
                    }}
                  />
                </div>
                <span className="tabular-nums" style={{ fontWeight: 700, fontSize: '14px' }}>
                  {transaction.risk_score}/100
                </span>
              </div>
            </div>
          </div>

          {/* Counterparties */}
          <div className="drawer-info-card">
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Counterparty Details
            </h4>
            <div className="drawer-info-row">
              <span className="drawer-info-label">Payer UPI ID</span>
              <span className="drawer-info-value" style={{ fontFamily: 'monospace' }}>{transaction.payer}</span>
            </div>
            <div className="drawer-info-row">
              <span className="drawer-info-label">Payee UPI ID</span>
              <span className="drawer-info-value" style={{ fontFamily: 'monospace' }}>{transaction.payee}</span>
            </div>
            <div className="drawer-info-row">
              <span className="drawer-info-label">Timestamp</span>
              <span className="drawer-info-value tabular-nums">{transaction.timestamp}</span>
            </div>
          </div>

          {/* Fraud Detection Reasons */}
          <div className={`reasons-box ${isHighRisk ? 'high-risk' : ''}`}>
            <div className="reasons-title" style={{ color: isHighRisk ? '#E84658' : '#C0770D' }}>
              {isHighRisk ? <ShieldAlert size={16} /> : isMedRisk ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
              <span>Fraud Detection Explanations</span>
            </div>
            {transaction.reasons && transaction.reasons.length > 0 ? (
              <ul className="reasons-list">
                {transaction.reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            ) : (
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                No active anomalies flagged during scoring.
              </p>
            )}
          </div>

          {/* Technical Telemetry & Metadata */}
          <div className="drawer-info-card">
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Telemetry & Rail Metadata
            </h4>
            <div className="drawer-info-row">
              <span className="drawer-info-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Globe size={13} /> IP Address
              </span>
              <span className="drawer-info-value">{transaction.metadata?.ip || '103.21.244.18'}</span>
            </div>
            <div className="drawer-info-row">
              <span className="drawer-info-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Smartphone size={13} /> Device Profile
              </span>
              <span className="drawer-info-value">{transaction.metadata?.device_os || 'Android 14 (SELinux Enforcing)'}</span>
            </div>
            <div className="drawer-info-row">
              <span className="drawer-info-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={13} /> Scoring Latency
              </span>
              <span className="drawer-info-value tabular-nums">{transaction.metadata?.latency_ms || 118} ms</span>
            </div>
            <div className="drawer-info-row">
              <span className="drawer-info-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Cpu size={13} /> Settlement Rail
              </span>
              <span className="drawer-info-value">{transaction.metadata?.upi_provider || 'UPI 2.0 / IMPS'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
