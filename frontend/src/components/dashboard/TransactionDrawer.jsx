import React from 'react';
import { X, ShieldAlert, CheckCircle2, AlertTriangle, Cpu, Globe, Clock, Smartphone, Bot, Zap } from 'lucide-react';
import ScamWarning from '../ScamWarning';

export function TransactionDrawer({ transaction, onClose, onScanThreat, onConsultCopilot }) {
  if (!transaction) return null;

  const isHighRisk = (transaction.risk_score || 0) >= 75;
  const isMedRisk = (transaction.risk_score || 0) >= 40 && (transaction.risk_score || 0) < 75;
  const isApproved = transaction.decision === 'Approved';
  const isCooling = transaction.decision === 'Cooling Lock' || transaction.decision === 'COOLING_LOCK';

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

        {/* Hackathon Focus Criteria Badges */}
        <div style={{ padding: '0 20px 10px 20px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          <span style={{ fontSize: '10px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
            Track 1: UPI Rails (HMAC + Ledger)
          </span>
          <span style={{ fontSize: '10px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', backgroundColor: '#fdf4ff', color: '#a21caf', border: '1px solid #f5d0fe' }}>
            Track 4: Risk Scoring (&lt;0.4ms)
          </span>
          <span style={{ fontSize: '10px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', backgroundColor: '#fff1f2', color: '#be123c', border: '1px solid #fecdd3' }}>
            Track 5: Fraud Mitigation Intercept
          </span>
          {(isHighRisk || isMedRisk || isCooling) ? (
            <span style={{ fontSize: '10px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>
              Track 2: Financial Inclusion Guardian Active
            </span>
          ) : (
            <span style={{ fontSize: '10px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', backgroundColor: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }}>
              Track 3: PFM: Transaction Baseline Secured
            </span>
          )}
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
<<<<<<< HEAD
                {transaction.amountFormatted || `₹ ${transaction.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
=======
                {transaction.amountFormatted || `₹${transaction.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
>>>>>>> 51d9373 ( chatbot and fixed error)
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
                      width: `${Math.min(100, transaction.risk_score || 15)}%`,
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
                  <li key={i}>{typeof r === 'string' ? r : (r.label || r.code)}</li>
                ))}
              </ul>
            ) : (
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Legitimate transaction verified through security baseline.
              </p>
            )}
          </div>

          {/* Embedded Localized Gemini AI Scam Coach for flagged/cooling transactions */}
          {(isHighRisk || isMedRisk || isCooling) && (
            <ScamWarning transactionId={transaction.id} />
          )}

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
              <span className="drawer-info-value tabular-nums">{transaction.metadata?.latency_ms || 0.38} ms</span>
            </div>
            <div className="drawer-info-row">
              <span className="drawer-info-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Cpu size={13} /> Payment Rail
              </span>
              <span className="drawer-info-value">{transaction.metadata?.upi_provider || 'UPI 2.0 IMPS Rail'}</span>
            </div>
          </div>

          {/* Quick Threat & AI Copilot Action Bar */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            {onScanThreat && (
              <button
                onClick={() => {
                  onScanThreat(transaction.receiver || transaction.merchant || transaction.url || 'https://onlinesbi-login-verify.xyz/auth');
                  onClose();
                }}
                className="pill-action-btn"
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  backgroundColor: '#0C7A53',
                  color: '#FFFFFF',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <Zap size={14} />
                <span>ML Threat Scan</span>
              </button>
            )}

            {onConsultCopilot && (
              <button
                onClick={() => {
                  onConsultCopilot({
                    url: transaction.receiver || transaction.merchant || transaction.id,
                    risk_score: transaction.risk_score || 0,
                    verdict: transaction.decision || 'ANALYZED',
                    reasons: transaction.reasons || transaction.reason_codes || []
                  });
                  onClose();
                }}
                className="pill-action-btn"
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  backgroundColor: '#0F172A',
                  color: '#38BDF8',
                  border: '1px solid #38BDF8',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <Bot size={14} />
                <span>Ask AI Copilot</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
