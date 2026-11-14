import React, { useState } from 'react';

export default function GuardianApproval({
  txnId,
  amount,
  senderVpa,
  receiverVpa,
  apiBaseUrl = 'http://localhost:8080',
  onComplete,
  onClose,
}) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleDecision = async (approved) => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/transactions/${txnId}/guardian`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approved,
          reason: approved
            ? 'Guardian approved: Verified payer intent'
            : 'Guardian rejected: Potential social engineering fraud',
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      onComplete(data);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.65)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: 12,
        padding: '1.75rem',
        maxWidth: 440,
        width: '90%',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            👥 Family Guardian Approval Required
          </h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '1.25rem', color: '#94a3b8', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        <div style={{
          padding: '0.75rem',
          background: '#fffbeb',
          borderLeft: '4px solid #f59e0b',
          borderRadius: 6,
          marginBottom: '1rem',
          fontSize: '0.825rem',
          color: '#92400e',
        }}>
          ⚠️ <strong>Suspicious Indicator:</strong> An active voice call was detected during payment creation. Please verify that the payer is not being coerced or impersonated.
        </div>

        {errorMsg && (
          <div style={{ padding: '0.5rem 0.75rem', background: '#fee2e2', color: '#991b1b', borderRadius: 6, fontSize: '0.8rem', marginBottom: '1rem' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 8, marginBottom: '1.25rem', fontSize: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ color: '#64748b' }}>Payer:</span>
            <strong style={{ color: '#1e293b' }}>{senderVpa}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ color: '#64748b' }}>Recipient:</span>
            <strong style={{ color: '#1e293b' }}>{receiverVpa}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '0.4rem' }}>
            <span style={{ color: '#64748b' }}>Amount:</span>
            <strong style={{ color: '#0f172a', fontSize: '1.05rem' }}>₹{amount.toFixed(2)}</strong>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => handleDecision(true)}
            disabled={loading}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: '#16a34a',
              color: '#ffffff',
              border: 'none',
              borderRadius: 6,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {loading ? 'Processing...' : '✓ Approve'}
          </button>
          <button
            onClick={() => handleDecision(false)}
            disabled={loading}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: '#dc2626',
              color: '#ffffff',
              border: 'none',
              borderRadius: 6,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {loading ? 'Processing...' : '✕ Decline & Block'}
          </button>
        </div>
      </div>
    </div>
  );
}
