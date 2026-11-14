import React, { useState } from 'react';

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
      backgroundColor: 'rgba(15, 23, 42, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(4px)',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '24px',
        maxWidth: '440px',
        width: '90%',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>
            👥 Guardian Co-Sign Approval
          </h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '18px', color: '#94a3b8', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#64748b' }}>
          This transfer was flagged for co-signer authorization due to anomalous context (active call or new payee).
        </p>

        {errorMsg && (
          <div style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: '12.5px', marginBottom: '14px' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '18px', fontSize: '13px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ color: '#64748b' }}>Payer:</span>
            <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{senderVpa}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ color: '#64748b' }}>Receiver:</span>
            <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{receiverVpa}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
            <span style={{ color: '#64748b' }}>Transfer Amount:</span>
            <span style={{ fontWeight: 700, color: '#0c7a53', fontSize: '15px' }}>
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
              backgroundColor: '#0c7a53',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '13px',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Submitting...' : '✓ Approve'}
          </button>
          <button
            onClick={() => handleDecision(false)}
            disabled={loading}
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: '#dc2626',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '13px',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Submitting...' : '✕ Reject'}
          </button>
        </div>
      </div>
    </div>
  );
}
