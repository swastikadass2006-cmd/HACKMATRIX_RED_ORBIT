import React, { useState, useEffect } from 'react';

export default function StepUpModal({ txnId, apiBaseUrl = 'http://localhost:8080', onSuccess, onClose }) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(120);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (otp.trim().length !== 6) {
      setErrorMsg('Please enter a valid 6-digit numeric OTP');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/transactions/${txnId}/stepup/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: otp.trim() }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      if (data.status === 'SETTLED') {
        onSuccess(data);
      } else if (data.status === 'REJECTED') {
        setErrorMsg('Invalid or expired OTP. Transaction has been rejected.');
        setTimeout(() => onSuccess(data), 1500);
      } else {
        onSuccess(data);
      }
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
        maxWidth: 420,
        width: '90%',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🔐 Step-Up Authentication
          </h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '1.25rem', color: '#94a3b8', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: '#64748b' }}>
          This payment triggered an automated step-up challenge. Please enter the 6-digit numeric OTP sent to your registered device.
        </p>

        {errorMsg && (
          <div style={{ padding: '0.5rem 0.75rem', background: '#fee2e2', color: '#991b1b', borderRadius: 6, fontSize: '0.8rem', marginBottom: '1rem' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <input
              type="text"
              maxLength={6}
              placeholder="••••••"
              value={otp}
              autoFocus
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '1.5rem',
                letterSpacing: '0.4rem',
                textAlign: 'center',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                boxSizing: 'border-box',
                fontWeight: 700,
                color: '#1e293b',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', fontSize: '0.8rem', color: '#64748b' }}>
            <span>Expires in: <strong>{secondsLeft}s</strong></span>
            {secondsLeft === 0 && <span style={{ color: '#ef4444', fontWeight: 600 }}>OTP Expired</span>}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="submit"
              disabled={loading || secondsLeft === 0 || otp.length !== 6}
              style={{
                flex: 1,
                padding: '0.75rem',
                background: secondsLeft === 0 || otp.length !== 6 ? '#94a3b8' : '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: 6,
                fontWeight: 600,
                cursor: secondsLeft === 0 || otp.length !== 6 ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.75rem 1rem',
                background: '#f1f5f9',
                color: '#475569',
                border: '1px solid #cbd5e1',
                borderRadius: 6,
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
