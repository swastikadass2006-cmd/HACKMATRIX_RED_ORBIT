import React, { useState } from 'react';
import { KeyRound, AlertTriangle, X } from 'lucide-react';

export default function StepUpModal({ 
  txnId, 
  apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '', 
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
        maxWidth: '400px',
        width: '90%',
        boxShadow: 'var(--shadow-floating)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <KeyRound size={18} style={{ color: 'var(--accent-primary)' }} />
            <span>Step-Up Verification</span>
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
          This payment scored within the step-up range. Enter the 6-digit OTP to authorize settlement.
        </p>

        {errorMsg && (
          <div style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)', color: 'var(--color-danger)', fontSize: '12.5px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={14} />
            <span>{errorMsg}</span>
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
                border: '1px solid var(--border-light)',
                boxSizing: 'border-box',
                fontWeight: 700,
                color: 'var(--text-primary)',
                backgroundColor: 'var(--bg-secondary)',
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
                backgroundColor: otp.length === 6 ? 'var(--accent-primary)' : 'var(--text-muted)',
                color: 'var(--text-inverse)',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: otp.length === 6 && !loading ? 'pointer' : 'not-allowed',
              }}
            >
              {loading ? 'Verifying…' : 'Submit OTP'}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 16px',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-light)',
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