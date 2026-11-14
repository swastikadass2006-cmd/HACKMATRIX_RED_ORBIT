import React, { useState } from 'react';
import { Users, AlertTriangle, X } from 'lucide-react';

export default function GuardianApproval({
  txnId,
  amount,
  senderVpa,
  receiverVpa,
  apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '',
  onComplete,
  onClose,
}) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleDecision = async (approved) => {
    setLoading(true);
    setErrorMsg(null);

    try {
      // POST to http://localhost:3000/api/transactions/{txn_id}/guardian
      const response = await fetch(`${apiBaseUrl}/api/transactions/${txnId}/guardian`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: Failed to submit decision`);
      }

      if (onComplete) {
        onComplete(data);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'var(--bg-overlay)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      fontFamily: 'var(--font-family)'
    }}>
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: '16px',
        padding: '24px',
        maxWidth: '440px',
        width: '90%',
        boxShadow: 'var(--shadow-floating)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={18} style={{ color: 'var(--accent-primary)' }} />
            <span>Guardian Co-Sign Approval</span>
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ background: 'none', border: 'none', padding: 0, color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          This transfer was flagged for co-signer authorization due to anomalous context (active call or new payee).
        </p>

        {errorMsg && (
          <div style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)', color: 'var(--color-danger)', fontSize: '12.5px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={14} />
            <span>{errorMsg}</span>
          </div>
        )}

        <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-light)', marginBottom: '18px', fontSize: '13px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Payer:</span>
            <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{senderVpa}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Receiver:</span>
            <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{receiverVpa}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-light)', paddingTop: '6px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Transfer Amount:</span>
            <span style={{ fontWeight: 700, color: 'var(--accent-primary)', fontSize: '15px' }}>
              ₹{parseFloat(amount || 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Approve / Reject Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => handleDecision(true)}
            disabled={loading}
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: 'var(--accent-primary)',
              color: 'var(--text-inverse)',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '13px',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Submitting…' : 'Approve'}
          </button>
          <button
            onClick={() => handleDecision(false)}
            disabled={loading}
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: 'var(--color-danger)',
              color: 'var(--text-inverse)',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '13px',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Submitting…' : 'Reject'}
          </button>
        </div>
      </div>
    </div>
  );
}