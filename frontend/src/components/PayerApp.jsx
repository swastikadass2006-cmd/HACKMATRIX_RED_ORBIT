import React, { useState, useEffect } from 'react';
import StepUpModal from './StepUpModal';
import GuardianApproval from './GuardianApproval';
import ScamWarning from './ScamWarning';

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
    <div style={{ maxWidth: '640px', margin: '24px auto', padding: '24px', backgroundColor: '#ffffff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header & Hackathon Focus Badges */}
      <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '14px', marginBottom: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>
            🛡️ ShieldPay Payer App
          </h2>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#0c7a53', backgroundColor: '#ecfdf5', padding: '4px 10px', borderRadius: '9999px', border: '1px solid #a7f3d0' }}>
            UPI 2.0 IMPS Rail
          </span>
        </div>

        {/* Hackathon Track Criteria Badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
          <span style={{ fontSize: '10.5px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
            Track 1: UPI Integration • HMAC-SHA256 • Double-Entry
          </span>
          <span style={{ fontSize: '10.5px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', backgroundColor: '#f5f3ff', color: '#6d28d9', border: '1px solid #ddd6fe' }}>
            Track 2: Financial Inclusion Guardian Active
          </span>
          <span style={{ fontSize: '10.5px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', backgroundColor: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }}>
            Track 3: PFM: Transaction Baseline Secured
          </span>
        </div>
      </div>

      {errorMsg && (
        <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: '13px', marginBottom: '16px' }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Payment Form */}
      <form onSubmit={handleInitiatePayment} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
              Sender VPA (Payer)
            </label>
            <input
              type="text"
              value={senderVpa}
              onChange={(e) => setSenderVpa(e.target.value)}
              required
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
              Receiver VPA (Payee)
            </label>
            <input
              type="text"
              value={receiverVpa}
              onChange={(e) => setReceiverVpa(e.target.value)}
              required
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
              Amount (₹ INR)
            </label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: 700, boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
              Device ID
            </label>
            <input
              type="text"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
              Geo City
            </label>
            <input
              type="text"
              value={geoCity}
              onChange={(e) => setGeoCity(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        {/* Threat Context Flags */}
        <div style={{ padding: '12px 14px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px dashed #cbd5e1', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Simulated Threat Signals (Judge Controls)
            </span>
            <span style={{ fontSize: '10px', color: '#94a3b8' }}>
              Track 4 & 5 Testing
            </span>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#334155', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={isOnCall}
              onChange={(e) => setIsOnCall(e.target.checked)}
              style={{ accentColor: '#0c7a53' }}
            />
            <span>Active Phone Call Detected (Coercion Indicator • Guardian Approval / Cooling)</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#334155', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={isScreenShare}
              onChange={(e) => setIsScreenShare(e.target.checked)}
              style={{ accentColor: '#0c7a53' }}
            />
            <span>Screen Sharing Active (RAT / Trojan Indicator • Immediate Block)</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#334155', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={isClipboardPaste}
              onChange={(e) => setIsClipboardPaste(e.target.checked)}
              style={{ accentColor: '#0c7a53' }}
            />
            <span>VPA Pasted from Clipboard (Clipboard Hijacking • 20s Cooling Lock)</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '12px',
            borderRadius: '8px',
            backgroundColor: '#0c7a53',
            color: '#ffffff',
            border: 'none',
            fontSize: '14px',
            fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 2px 8px rgba(12, 122, 83, 0.25)',
            transition: 'background-color 0.15s',
          }}
        >
          {loading ? 'Computing HMAC & Dispatching...' : `Pay ₹${parseFloat(amount || 0).toLocaleString('en-IN')}`}
        </button>
      </form>

      {/* Transaction & Signature Telemetry Box */}
      {currentTxn && (
        <div style={{ marginTop: '20px', padding: '14px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '12.5px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontWeight: 700, color: '#334155' }}>TRANSACTION STATE</span>
            <span style={{
              padding: '3px 10px',
              borderRadius: '9999px',
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: txnState === 'SETTLED' || txnState === 'APPROVED' ? '#dcfce7' : txnState === 'BLOCKED' || txnState === 'REJECTED' ? '#fee2e2' : '#fef9c3',
              color: txnState === 'SETTLED' || txnState === 'APPROVED' ? '#15803d' : txnState === 'BLOCKED' || txnState === 'REJECTED' ? '#b91c1c' : '#a16207',
            }}>
              ● {txnState}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', color: '#475569' }}>
            <div><strong>Txn ID:</strong> <span style={{ fontFamily: 'monospace' }}>{currentTxn.txn_id || currentTxn.id}</span></div>
            <div><strong>Payer:</strong> {currentTxn.sender_vpa || currentTxn.payer} ➔ <strong>Payee:</strong> {currentTxn.receiver_vpa || currentTxn.payee}</div>
            <div><strong>Amount:</strong> ₹{parseFloat(currentTxn.amount || 0).toLocaleString('en-IN')}</div>
            {currentTxn.risk_score !== undefined && (
              <div><strong>Risk Score:</strong> {Math.round(currentTxn.risk_score * (currentTxn.risk_score <= 1 ? 100 : 1))}/100</div>
            )}
            {lastSignature && (
              <div style={{ marginTop: '4px', wordBreak: 'break-all', fontSize: '11px', color: '#64748b' }}>
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
          backgroundColor: '#eff6ff',
          border: '1.5px solid #93c5fd',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              🛡️ Track 3: PFM Cooling Lock Engaged
            </span>
            <span style={{
              fontSize: '12px',
              fontWeight: 800,
              color: '#1e40af',
              backgroundColor: '#dbeafe',
              padding: '2px 8px',
              borderRadius: '6px',
            }}>
              ⏱️ {coolingSecondsLeft > 0 ? `${coolingSecondsLeft}s remaining` : 'Timer Expired'}
            </span>
          </div>

          <p style={{ margin: 0, fontSize: '12.5px', color: '#1e3a8a', lineHeight: '1.4' }}>
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
                backgroundColor: '#dc2626',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '12.5px',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              🛑 Cancel Payment (Remorse Protection)
            </button>

            <button
              onClick={handleReleaseCooling}
              disabled={loading || coolingSecondsLeft > 0}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: '8px',
                backgroundColor: coolingSecondsLeft > 0 ? '#cbd5e1' : '#16a34a',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '12.5px',
                cursor: (loading || coolingSecondsLeft > 0) ? 'not-allowed' : 'pointer',
              }}
            >
              {coolingSecondsLeft > 0 ? `Wait ${coolingSecondsLeft}s to Settle` : '✓ Settle Payment'}
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
