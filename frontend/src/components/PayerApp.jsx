import React, { useState, useEffect } from 'react';
import StepUpModal from './StepUpModal';
import GuardianApproval from './GuardianApproval';

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
export default function PayerApp({ apiBaseUrl = 'http://localhost:3000' }) {
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

  // SSE Stream: Listen for real-time state changes on http://localhost:3000/api/stream
  useEffect(() => {
    let eventSource;
    try {
      eventSource = new EventSource(`${apiBaseUrl}/api/stream`);

      eventSource.addEventListener('txn.updated', (event) => {
        try {
          const updated = JSON.parse(event.data);
          const currentId = currentTxn?.txn_id;

          if (!currentId || updated.txn_id === currentId) {
            setCurrentTxn(updated);

            const state = updated.status || updated.state;
            if (state === 'STEP_UP_PENDING') {
              setShowStepUpModal(true);
            } else if (state === 'GUARDIAN_PENDING') {
              setShowGuardianModal(true);
            } else if (state === 'APPROVED' || state === 'SETTLED' || state === 'BLOCKED' || state === 'REJECTED') {
              setShowStepUpModal(false);
              setShowGuardianModal(false);
            }
          }
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

      // POST to Axum backend at http://localhost:3000/api/transactions
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

  const txnState = currentTxn?.status || currentTxn?.state || 'IDLE';

  return (
    <div style={{ maxWidth: '580px', margin: '24px auto', padding: '24px', backgroundColor: '#ffffff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '14px', marginBottom: '18px' }}>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>
          🛡️ ShieldPay Payer App
        </h2>
        <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
          Axum Core Payment Rail & HMAC Security Verification
        </p>
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
              Sender VPA
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
              Receiver VPA
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
              City
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
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Risk Signals
          </span>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#334155', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={isOnCall}
              onChange={(e) => setIsOnCall(e.target.checked)}
              style={{ accentColor: '#0c7a53' }}
            />
            <span>Active Call Detected (Triggers Guardian Approval)</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#334155', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={isScreenShare}
              onChange={(e) => setIsScreenShare(e.target.checked)}
              style={{ accentColor: '#0c7a53' }}
            />
            <span>Screen Sharing Active (Trojan Indicator)</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#334155', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={isClipboardPaste}
              onChange={(e) => setIsClipboardPaste(e.target.checked)}
              style={{ accentColor: '#0c7a53' }}
            />
            <span>VPA Pasted from Clipboard (Cooling Lock)</span>
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
            transition: 'background-color 0.15s'
          }}
        >
          {loading ? 'Computing HMAC & Sending...' : `Pay ₹${parseFloat(amount || 0).toLocaleString('en-IN')}`}
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
            <div><strong>Txn ID:</strong> <span style={{ fontFamily: 'monospace' }}>{currentTxn.txn_id}</span></div>
            <div><strong>Payer:</strong> {currentTxn.sender_vpa} ➔ <strong>Payee:</strong> {currentTxn.receiver_vpa}</div>
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

      {/* Step-Up OTP Modal */}
      {showStepUpModal && currentTxn && (
        <StepUpModal
          txnId={currentTxn.txn_id}
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
          txnId={currentTxn.txn_id}
          amount={currentTxn.amount}
          senderVpa={currentTxn.sender_vpa}
          receiverVpa={currentTxn.receiver_vpa}
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
