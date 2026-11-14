import React, { useState, useEffect } from 'react';
import StepUpModal from './StepUpModal';
import GuardianApproval from './GuardianApproval';
import ScamWarning from './ScamWarning';
import { Shield, ShieldCheck, AlertTriangle, Clock, Ban, CheckCircle2 } from 'lucide-react';

// -----------------------------------------------------------------------
// 1. Web Crypto API: HMAC-SHA256 hex digest generator
// -----------------------------------------------------------------------
export async function generateHmacSha256(secretKey, rawBody) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secretKey);
  const messageData = encoder.encode(rawBody);

  const cryptoKey = await window.crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: { name: 'SHA-256' } },
    false,
    ['sign']
  );

  const signatureBuffer = await window.crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    messageData
  );

  return Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// RFC-compliant UUIDv4 generator
function getUuid() {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// -----------------------------------------------------------------------
// 2. PayerApp Component
// -----------------------------------------------------------------------
export default function PayerApp({ apiBaseUrl = '' }) {
  // Form fields
  const [senderVpa, setSenderVpa] = useState('rahul@okaxis');
  const [receiverVpa, setReceiverVpa] = useState('shop@ybl');
  const [amount, setAmount] = useState(4900.0);
  const [deviceId, setDeviceId] = useState('dev-91ac');
  const [geoCity, setGeoCity] = useState('Kolkata');

  // Threat context indicators
  const [isOnCall, setIsOnCall] = useState(false);
  const [isScreenShare, setIsScreenShare] = useState(false);
  const [isClipboardPaste, setIsClipboardPaste] = useState(false);

  // Transaction & UI states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [currentTxn, setCurrentTxn] = useState(null);
  const [lastSignature, setLastSignature] = useState('');
  const [showStepUpModal, setShowStepUpModal] = useState(false);
  const [showGuardianModal, setShowGuardianModal] = useState(false);
  const [coolingSecondsLeft, setCoolingSecondsLeft] = useState(0);

  // SSE Stream: Listen for real-time state changes on /api/stream
  useEffect(() => {
    let eventSource;
    try {
      const streamUrl = `${apiBaseUrl}/api/stream`;
      eventSource = new EventSource(streamUrl);

      const handleUpdate = (data) => {
        const currentId = currentTxn?.txn_id;
        if (!currentId || data.txn_id === currentId || data.id === currentId) {
          setCurrentTxn((prev) => ({ ...prev, ...data }));

          const state = data.status || data.state;
          if (state === 'STEP_UP_PENDING') {
            setShowStepUpModal(true);
          } else if (state === 'GUARDIAN_PENDING') {
            setShowGuardianModal(true);
          } else if (state === 'APPROVED' || state === 'SETTLED' || state === 'BLOCKED' || state === 'REJECTED') {
            setShowStepUpModal(false);
            setShowGuardianModal(false);
          }
        }
      };

      eventSource.addEventListener('txn.updated', (event) => {
        try {
          handleUpdate(JSON.parse(event.data));
        } catch (err) {
          console.error('SSE parse error:', err);
        }
      });

      eventSource.addEventListener('transaction', (event) => {
        try {
          handleUpdate(JSON.parse(event.data));
        } catch (err) {
          console.error('SSE parse error:', err);
        }
      });

      eventSource.onerror = (err) => {
        console.warn('SSE connection warning:', err);
      };
    } catch (err) {
      console.warn('EventSource initialization failed:', err);
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [apiBaseUrl, currentTxn?.txn_id]);

  // Cooling timer countdown calculation
  useEffect(() => {
    const txnState = currentTxn?.status || currentTxn?.state;
    if (txnState !== 'COOLING_LOCK' || !currentTxn?.cooling_until) {
      setCoolingSecondsLeft(0);
      return;
    }

    const updateTimer = () => {
      const diffMs = new Date(currentTxn.cooling_until).getTime() - Date.now();
      const secs = Math.max(0, Math.ceil(diffMs / 1000));
      setCoolingSecondsLeft(secs);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 500);
    return () => clearInterval(interval);
  }, [currentTxn?.status, currentTxn?.state, currentTxn?.cooling_until]);

  // Initiate Transaction
  const handleInitiatePayment = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const txnId = getUuid();
      const idempotencyKey = getUuid();
      const timestamp = new Date().toISOString();

      // Exact JSON payload matching the contract
      const payload = {
        txn_id: txnId,
        idempotency_key: idempotencyKey,
        sender_vpa: senderVpa.trim(),
        receiver_vpa: receiverVpa.trim(),
        amount: parseFloat(amount),
        device_id: deviceId.trim(),
        geo_city: geoCity.trim(),
        timestamp: timestamp,
        is_on_active_call: Boolean(isOnCall),
        screen_share_detected: Boolean(isScreenShare),
        vpa_pasted_from_clipboard: Boolean(isClipboardPaste),
      };

      const rawJson = JSON.stringify(payload);

      // SECURITY: Generate HMAC-SHA256 signature using window.crypto.subtle
      const signature = await generateHmacSha256('dev-secret-key', rawJson);
      setLastSignature(signature);

      // POST to Axum backend at /api/transactions
      const response = await fetch(`${apiBaseUrl}/api/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Signature': signature,
        },
        body: rawJson,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: Payment rejected`);
      }

      setCurrentTxn(data);

      const state = data.status || data.state;
      if (state === 'STEP_UP_PENDING') {
        setShowStepUpModal(true);
      } else if (state === 'GUARDIAN_PENDING') {
        setShowGuardianModal(true);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Payment initiation failed');
    } finally {
      setLoading(false);
    }
  };

  // Remorse Cancellation during COOLING_LOCK
  const handleCancelCooling = async () => {
    if (!currentTxn?.txn_id) return;
    try {
      setLoading(true);
      const res = await fetch(`${apiBaseUrl}/api/transactions/${currentTxn.txn_id}/cooling/release`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancel: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to cancel cooling transaction');
      setCurrentTxn(data);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Settlement after Cooling Lock expiration
  const handleReleaseCooling = async () => {
    if (!currentTxn?.txn_id) return;
    try {
      setLoading(true);
      const res = await fetch(`${apiBaseUrl}/api/transactions/${currentTxn.txn_id}/cooling/release`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancel: false }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to release cooling lock');
      setCurrentTxn(data);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const txnState = currentTxn?.status || currentTxn?.state || 'IDLE';

  return (
    <div style={{ maxWidth: '640px', margin: '24px auto', padding: '24px', backgroundColor: 'var(--bg-surface)', borderRadius: '16px', boxShadow: '0 4px 20px var(--shadow-subtle)', fontFamily: 'var(--font-family)' }}>
      {/* Header & Hackathon Focus Badges */}
      <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '14px', marginBottom: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Shield size={20} style={{ color: 'var(--accent-primary)' }} /><span>ShieldPay Payer App</span></span>
          </h2>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-primary)', backgroundColor: 'var(--accent-mint-light)', padding: '4px 10px', borderRadius: '9999px', border: '1px solid var(--color-success-border)' }}>
            UPI 2.0 IMPS Rail
          </span>
        </div>

        {/* Hackathon Track Criteria Badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
          <span style={{ fontSize: '10.5px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', backgroundColor: 'var(--color-info-bg)', color: 'var(--accent-primary)', border: '1px solid var(--border-light)' }}>
            Track 1: UPI Integration | HMAC-SHA256 | Double-Entry
          </span>
          <span style={{ fontSize: '10.5px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', backgroundColor: 'var(--color-purple-bg)', color: 'var(--accent-dark)', border: '1px solid var(--border-light)' }}>
            Track 2: Financial Inclusion Guardian Active
          </span>
          <span style={{ fontSize: '10.5px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', backgroundColor: 'var(--accent-mint-light)', color: 'var(--color-success)', border: '1px solid var(--color-success-border)' }}>
            Track 3: PFM: Transaction Baseline Secured
          </span>
        </div>
      </div>

      {errorMsg && (
        <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)', color: 'var(--color-danger)', fontSize: '13px', marginBottom: '16px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><AlertTriangle size={14} /><span>{errorMsg}</span></span>
        </div>
      )}

      {/* Payment Form */}
      <form onSubmit={handleInitiatePayment} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Sender VPA (Payer)
            </label>
            <input
              type="text"
              value={senderVpa}
              onChange={(e) => setSenderVpa(e.target.value)}
              required
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-light)', fontSize: '13px', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Receiver VPA (Payee)
            </label>
            <input
              type="text"
              value={receiverVpa}
              onChange={(e) => setReceiverVpa(e.target.value)}
              required
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-light)', fontSize: '13px', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Amount (₹ INR)
            </label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-light)', fontSize: '14px', fontWeight: 700, boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Device ID
            </label>
            <input
              type="text"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-light)', fontSize: '13px', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Geo City
            </label>
            <input
              type="text"
              value={geoCity}
              onChange={(e) => setGeoCity(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-light)', fontSize: '13px', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        {/* Threat Context Flags */}
        <div style={{ padding: '12px 14px', borderRadius: '10px', backgroundColor: 'var(--bg-secondary)', border: '1px dashed var(--border-light)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Simulated Threat Signals (Judge Controls)
            </span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              Track 4 & 5 Testing
            </span>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: 'var(--text-primary)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={isOnCall}
              onChange={(e) => setIsOnCall(e.target.checked)}
              style={{ accentColor: 'var(--accent-primary)' }}
            />
            <span>Active Phone Call Detected (Coercion Indicator | Guardian Approval / Cooling)</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: 'var(--text-primary)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={isScreenShare}
              onChange={(e) => setIsScreenShare(e.target.checked)}
              style={{ accentColor: 'var(--accent-primary)' }}
            />
            <span>Screen Sharing Active (RAT / Trojan Indicator | Immediate Block)</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: 'var(--text-primary)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={isClipboardPaste}
              onChange={(e) => setIsClipboardPaste(e.target.checked)}
              style={{ accentColor: 'var(--accent-primary)' }}
            />
            <span>VPA Pasted from Clipboard (Clipboard Hijacking | 20s Cooling Lock)</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '12px',
            borderRadius: '8px',
            backgroundColor: 'var(--accent-primary)',
            color: 'var(--text-inverse)',
            border: 'none',
            fontSize: '14px',
            fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 2px 8px var(--btn-solid-shadow)',
            transition: 'background-color 0.15s ease',
          }}
        >
          {loading ? 'Computing HMAC & Dispatching…' : `Pay ₹${parseFloat(amount || 0).toLocaleString('en-IN')}`}
        </button>
      </form>

      {/* Transaction & Signature Telemetry Box */}
      {currentTxn && (
        <div style={{ marginTop: '20px', padding: '14px', borderRadius: '10px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-light)', fontSize: '12.5px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>TRANSACTION STATE</span>
            <span style={{
              padding: '3px 10px',
              borderRadius: '9999px',
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: txnState === 'SETTLED' || txnState === 'APPROVED' ? 'var(--accent-mint-light)' : txnState === 'BLOCKED' || txnState === 'REJECTED' ? 'var(--color-danger-bg)' : 'var(--color-warning-soft)',
              color: txnState === 'SETTLED' || txnState === 'APPROVED' ? 'var(--color-success)' : txnState === 'BLOCKED' || txnState === 'REJECTED' ? 'var(--color-danger)' : 'var(--color-warning)',
            }}>
              ● {txnState}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', color: 'var(--text-secondary)' }}>
            <div><strong>Txn ID:</strong> <span style={{ fontFamily: 'monospace' }}>{currentTxn.txn_id || currentTxn.id}</span></div>
            <div><strong>Payer:</strong> {currentTxn.sender_vpa || currentTxn.payer} ➔ <strong>Payee:</strong> {currentTxn.receiver_vpa || currentTxn.payee}</div>
            <div><strong>Amount:</strong> ₹{parseFloat(currentTxn.amount || 0).toLocaleString('en-IN')}</div>
            {currentTxn.risk_score !== undefined && (
              <div><strong>Risk Score:</strong> {Math.round(currentTxn.risk_score * (currentTxn.risk_score <= 1 ? 100 : 1))}/100</div>
            )}
            {lastSignature && (
              <div style={{ marginTop: '4px', wordBreak: 'break-all', fontSize: '11px', color: 'var(--text-secondary)' }}>
                <strong>X-Signature:</strong> <span style={{ fontFamily: 'monospace' }}>{lastSignature}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* COOLING_LOCK Banner & Remorse Protection Controls */}
      {txnState === 'COOLING_LOCK' && currentTxn && (
        <div style={{
          marginTop: '16px',
          padding: '16px',
          borderRadius: '12px',
          backgroundColor: 'var(--color-info-bg)',
          border: '1.5px solid var(--border-light)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><ShieldCheck size={14} /><span>Track 3: PFM Cooling Lock Engaged</span></span>
            </span>
            <span style={{
              fontSize: '12px',
              fontWeight: 800,
              color: 'var(--accent-primary)',
              backgroundColor: 'var(--color-info-bg)',
              padding: '2px 8px',
              borderRadius: '6px',
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /><span>{coolingSecondsLeft > 0 ? `${coolingSecondsLeft}s remaining` : 'Timer Expired'}</span></span>
            </span>
          </div>

          <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-primary)', lineHeight: '1.4' }}>
            <strong>Payer Remorse Window Active:</strong> Funds are held safely in atomic ledger escrow. If you did not intend this transfer, cancel now to reject and retain your balance.
          </p>

          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button
              onClick={handleCancelCooling}
              disabled={loading}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: '8px',
                backgroundColor: 'var(--color-danger)',
                color: 'var(--text-inverse)',
                border: 'none',
                fontWeight: 700,
                fontSize: '12.5px',
                cursor: loading ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><Ban size={14} /><span>Cancel (Remorse)</span></span>
            </button>

            <button
              onClick={handleReleaseCooling}
              disabled={loading || coolingSecondsLeft > 0}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: '8px',
                backgroundColor: coolingSecondsLeft > 0 ? 'var(--border-light)' : 'var(--color-success)',
                color: 'var(--text-inverse)',
                border: 'none',
                fontWeight: 700,
                fontSize: '12.5px',
                cursor: (loading || coolingSecondsLeft > 0) ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {coolingSecondsLeft > 0 ? `Wait ${coolingSecondsLeft}s to Settle` : <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><CheckCircle2 size={14} /><span>Settle Payment</span></span>}
            </button>
          </div>

          {/* Localized Gemini Scam Coach embedded during COOLING_LOCK */}
          <ScamWarning transactionId={currentTxn.txn_id || currentTxn.id} />
        </div>
      )}

      {/* Step-Up OTP Modal */}
      {showStepUpModal && currentTxn && (
        <StepUpModal
          txnId={currentTxn.txn_id || currentTxn.id}
          apiBaseUrl={apiBaseUrl}
          onSuccess={(updated) => {
            setCurrentTxn(updated);
            setShowStepUpModal(false);
          }}
          onClose={() => setShowStepUpModal(false)}
        />
      )}

      {/* Guardian Approval Modal */}
      {showGuardianModal && currentTxn && (
        <GuardianApproval
          txnId={currentTxn.txn_id || currentTxn.id}
          amount={currentTxn.amount}
          senderVpa={currentTxn.sender_vpa || currentTxn.payer}
          receiverVpa={currentTxn.receiver_vpa || currentTxn.payee}
          apiBaseUrl={apiBaseUrl}
          onComplete={(updated) => {
            setCurrentTxn(updated);
            setShowGuardianModal(false);
          }}
          onClose={() => setShowGuardianModal(false)}
        />
      )}
    </div>
  );
}