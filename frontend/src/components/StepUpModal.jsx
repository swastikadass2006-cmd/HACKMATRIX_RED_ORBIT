import React, { useState } from 'react';

export default function StepUpModal({ 
  txnId, 
  apiBaseUrl = 'http://localhost:3000', 
  onSuccess, 
  onClose 
}) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (otp.trim().length !== 6) {
      setErrorMsg('Please enter a 6-digit numeric OTP');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      // POST to http://localhost:3000/api/transactions/{txn_id}/stepup/verify
      const response = await fetch(`${apiBaseUrl}/api/transactions/${txnId}/stepup/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: otp.trim() }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Invalid OTP (HTTP ${response.status})`);
      }

      // Handle success: state transitions to APPROVED / SETTLED
      if (onSuccess) {
        onSuccess(data);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Verification failed');
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
        maxWidth: '400px',
        width: '90%',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>
            🔐 Step-Up Verification
          </h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '18px', color: '#94a3b8', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#64748b' }}>
          This payment scored within the step-up range. Enter the 6-digit OTP to authorize settlement.
        </p>

        {errorMsg && (
          <div style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: '12.5px', marginBottom: '14px' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <input
              type="text"
              maxLength={6}
              placeholder="123456"
              value={otp}
              autoFocus
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '22px',
                letterSpacing: '0.3em',
                textAlign: 'center',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                boxSizing: 'border-box',
                fontWeight: 700,
                color: '#0f172a',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: otp.length === 6 ? '#0c7a53' : '#94a3b8',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: otp.length === 6 && !loading ? 'pointer' : 'not-allowed',
              }}
            >
              {loading ? 'Verifying...' : 'Submit OTP'}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 16px',
                backgroundColor: '#f1f5f9',
                color: '#475569',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
