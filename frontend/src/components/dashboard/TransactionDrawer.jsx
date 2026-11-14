import React from 'react';
import { X, ShieldAlert, CheckCircle2, AlertTriangle, Cpu, Globe, Clock, Smartphone } from 'lucide-react';

export function TransactionDrawer({ transaction, onClose }) {
  if (!transaction) return null;

  const isHighRisk = (transaction.risk_score || 0) >= 75;
  const isMedRisk = (transaction.risk_score || 0) >= 40 && (transaction.risk_score || 0) < 75;
  const isApproved = transaction.decision === 'Approved';

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
              Inspection Telemetry
            </span>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {transaction.id}
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className="circle-action-btn"
            aria-label="Close drawer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="drawer-body">
          {/* Main Status & Amount Card */}
          <div className="drawer-info-card" style={{ backgroundColor: 'var(--accent-mint-light)', borderColor: 'var(--accent-mint-border)' }}>
            <div className="drawer-info-row">
              <span className="drawer-info-label">Risk Decision</span>
              <span 
                style={{ 
                  fontWeight: 700, 
                  fontSize: '12.5px',
                  color: isApproved ? 'var(--color-success)' : isHighRisk ? 'var(--color-danger)' : 'var(--color-warning)'
                }}
              >
                ● {transaction.decision}
              </span>
            </div>

            <div className="drawer-info-row">
              <span className="drawer-info-label">Transfer Amount</span>
              <span className="tabular-nums" style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {transaction.amountFormatted || `$${transaction.amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
              </span>
            </div>

            <div className="drawer-info-row">
              <span className="drawer-info-label">Risk Classification</span>
              <span style={{ fontWeight: 700, fontSize: '12.5px', color: isHighRisk ? 'var(--color-danger)' : isMedRisk ? 'var(--color-warning)' : 'var(--color-success)' }}>
                {transaction.classification || (isHighRisk ? 'High Risk' : isMedRisk ? 'Medium Risk' : 'Low Risk')}
              </span>
            </div>

            <div className="drawer-info-row">
              <span className="drawer-info-label">Risk Score</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '80px', height: '7px', backgroundColor: '#D2EADB', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${transaction.risk_score || 15}%`,
                      backgroundColor: isHighRisk ? 'var(--color-danger)' : isMedRisk ? 'var(--color-warning)' : 'var(--color-success)'
                    }}
                  />
                </div>
                <span className="tabular-nums" style={{ fontWeight: 700, fontSize: '13px' }}>
                  {transaction.risk_score || 15}/100
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
              <span className="drawer-info-label">Payer Account</span>
              <span className="drawer-info-value" style={{ fontFamily: 'monospace' }}>{transaction.payer}</span>
            </div>
            <div className="drawer-info-row">
              <span className="drawer-info-label">Payee Account</span>
              <span className="drawer-info-value" style={{ fontFamily: 'monospace' }}>{transaction.payee}</span>
            </div>
            <div className="drawer-info-row">
              <span className="drawer-info-label">Timestamp</span>
              <span className="drawer-info-value tabular-nums">{transaction.timestamp}</span>
            </div>
          </div>

          {/* Reasons */}
          <div className="drawer-info-card" style={{ borderColor: isHighRisk ? '#FBDCE0' : '#E7ECE8' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: isHighRisk ? 'var(--color-danger)' : 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {isHighRisk ? <ShieldAlert size={15} /> : isMedRisk ? <AlertTriangle size={15} /> : <CheckCircle2 size={15} />}
              Decision Explanations
            </h4>
            {transaction.reasons && transaction.reasons.length > 0 ? (
              <ul style={{ paddingLeft: '18px', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {transaction.reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            ) : (
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Legitimate transaction verified through security baseline.
              </p>
            )}
          </div>

          {/* Device & Network Telemetry */}
          <div className="drawer-info-card">
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Device & Network Telemetry
            </h4>
            <div className="drawer-info-row">
              <span className="drawer-info-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Globe size={13} /> IP Address
              </span>
              <span className="drawer-info-value">{transaction.metadata?.ip || '103.21.244.18'}</span>
            </div>
            <div className="drawer-info-row">
              <span className="drawer-info-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Smartphone size={13} /> Operating System
              </span>
              <span className="drawer-info-value">{transaction.metadata?.device_os || 'Android 14 (SELinux)'}</span>
            </div>
            <div className="drawer-info-row">
              <span className="drawer-info-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={13} /> Evaluation Latency
              </span>
              <span className="drawer-info-value tabular-nums">{transaction.metadata?.latency_ms || 118} ms</span>
            </div>
            <div className="drawer-info-row">
              <span className="drawer-info-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Cpu size={13} /> Payment Rail
              </span>
              <span className="drawer-info-value">{transaction.metadata?.upi_provider || 'UPI 2.0 IMPS Rail'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
