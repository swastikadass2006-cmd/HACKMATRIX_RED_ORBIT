import React, { useState, useEffect } from 'react';
import StepUpModal from './StepUpModal';
import GuardianApproval from './GuardianApproval';

// Helper to compute HMAC-SHA256 hex signature using standard browser Web Crypto API
async function computeHmacSha256(secret, message) {
  const enc = new TextEncoder();
  const key = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await window.crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Generate simple UUIDv4
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function PayerApp({ apiBaseUrl = 'http://localhost:8080' }) {
  const [senderVpa, setSenderVpa] = useState('rahul@okaxis');
  const [receiverVpa, setReceiverVpa] = useState('shop@ybl');
  const [amount, setAmount] = useState(500);
  const [geoCity, setGeoCity] = useState('Kolkata');
  const [deviceId] = useState('dev-91ac');

  // Simulation flags for hackathon demo
  const [isOnCall, setIsOnCall] = useState(false);
  const [isScreenShare, setIsScreenShare] = useState(false);
  const [isClipboardPaste, setIsClipboardPaste] = useState(false);

  // Transaction State
  const [loading, setLoading] = useState(false);
  const [currentTxn, setCurrentTxn] = useState(null);
  const [auditTrail, setAuditTrail] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);
  const [showStepUpModal, setShowStepUpModal] = useState(false);
  const [showGuardianModal, setShowGuardianModal] = useState(false);
  const [coolingSecondsLeft, setCoolingSecondsLeft] = useState(null);

  // SSE Stream listener for real-time transaction updates
  useEffect(() => {
    let eventSource;
    try {
      eventSource = new EventSource(`${apiBaseUrl}/api/stream`);
      eventSource.addEventListener('txn.updated', (e) => {
        try {
          const updatedTxn = JSON.parse(e.data);
          if (currentTxn && updatedTxn.txn_id === currentTxn.txn_id) {
            setCurrentTxn(updatedTxn);
            fetchAuditTrail(updatedTxn.txn_id);
          }
        } catch (err) {
          console.error('Error parsing SSE txn.updated:', err);
        }
      });
    } catch (err) {
      console.warn('SSE stream unavailable:', err);
    }
    return () => {
      if (eventSource) eventSource.close();
    };
  }, [currentTxn, apiBaseUrl]);

  // Cooling timer countdown
  useEffect(() => {
    let timer;
    if (coolingSecondsLeft !== null && coolingSecondsLeft > 0) {
      timer = setTimeout(() => {
        setCoolingSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [coolingSecondsLeft]);

  const fetchAuditTrail = async (txnId) => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/audit/${txnId}`);
      if (res.ok) {
        const data = await res.json();
        setAuditTrail(data);
      }
    } catch (err) {
      console.error('Failed to fetch audit trail:', err);
    }
  };

  const handlePay = async (replayExisting = false) => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const txnId = replayExisting && currentTxn ? currentTxn.txn_id : uuidv4();
      const idempotencyKey = replayExisting && currentTxn ? currentTxn.idempotency_key : uuidv4();

      const payload = {
        txn_id: txnId,
        idempotency_key: idempotencyKey,
        sender_vpa: senderVpa,
        receiver_vpa: receiverVpa,
        amount: parseFloat(amount),
        device_id: deviceId,
        geo_city: geoCity,
        timestamp: new Date().toISOString(),
        is_on_active_call: isOnCall,
        screen_share_detected: isScreenShare,
        vpa_pasted_from_clipboard: isClipboardPaste,
        label_is_fraud: null,
      };

      const rawBody = JSON.stringify(payload);
      const signature = await computeHmacSha256('dev-secret-key', rawBody);

      const response = await fetch(`${apiBaseUrl}/api/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Signature': signature,
        },
        body: rawBody,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      setCurrentTxn(data);
      await fetchAuditTrail(data.txn_id);

      if (data.status === 'STEP_UP_PENDING') {
        setShowStepUpModal(true);
      } else if (data.status === 'GUARDIAN_PENDING') {
        setShowGuardianModal(true);
      } else if (data.status === 'COOLING_LOCK') {
        setCoolingSecondsLeft(20);
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReleaseCooling = async (cancel = false) => {
    if (!currentTxn) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`${apiBaseUrl}/api/transactions/${currentTxn.txn_id}/cooling/release`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancel }),
      });
      const data = await res.json();
      if (res.status === 425) {
        setErrorMsg(`Too Early: ${data.error} (${Math.ceil(data.remaining_milliseconds / 1000)}s left)`);
      } else if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      } else {
        setCurrentTxn(data);
        setCoolingSecondsLeft(null);
        await fetchAuditTrail(data.txn_id);
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 640, margin: '2rem auto', fontFamily: 'system-ui, -apple-system, sans-serif', padding: '1.5rem', background: '#ffffff', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
      <header style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          🛡️ ShieldPay Payer App
        </h2>
        <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.875rem' }}>
          Secure, real-time UPI payments with automated fraud scoring & cryptographic integrity.
        </p>
      </header>

      {errorMsg && (
        <div style={{ padding: '0.75rem 1rem', background: '#fee2e2', borderLeft: '4px solid #ef4444', color: '#991b1b', borderRadius: 6, marginBottom: '1rem', fontSize: '0.875rem' }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Payment Form */}
      <div style={{ display: 'grid', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>
            Sender VPA
          </label>
          <input
            type="text"
            value={senderVpa}
            onChange={(e) => setSenderVpa(e.target.value)}
            style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>
            Receiver VPA
          </label>
          <input
            type="text"
            value={receiverVpa}
            onChange={(e) => setReceiverVpa(e.target.value)}
            style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>
            Amount (₹)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', boxSizing: 'border-box' }}
          />
        </div>

        {/* Demo Fraud Scenarios Toggles */}
        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 8, border: '1px dashed #cbd5e1' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: 0.5 }}>
            Fraud Attack Simulation Toggles
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#334155' }}>
              <input type="checkbox" checked={isOnCall} onChange={(e) => setIsOnCall(e.target.checked)} />
              Active Phone Call (Triggers Guardian Approval)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#334155' }}>
              <input type="checkbox" checked={isScreenShare} onChange={(e) => setIsScreenShare(e.target.checked)} />
              Screen Sharing Active (Triggers Trojan Block if on call)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#334155' }}>
              <input type="checkbox" checked={isClipboardPaste} onChange={(e) => setIsClipboardPaste(e.target.checked)} />
              VPA Pasted from Clipboard (Triggers 20s Cooling Lock)
            </label>
          </div>
        </div>

        {/* Payment Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button
            onClick={() => handlePay(false)}
            disabled={loading}
            style={{ flex: 1, padding: '0.8rem', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', transition: 'background 0.2s' }}
          >
            {loading ? 'Processing...' : `Pay ₹${amount}`}
          </button>
          {currentTxn && (
            <button
              onClick={() => handlePay(true)}
              disabled={loading}
              title="Replays exact same idempotency_key to prove zero duplicate ledger debit"
              style={{ padding: '0.8rem 1rem', background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: 8, fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
            >
              🔄 Replay (Idempotency)
            </button>
          )}
        </div>
      </div>

      {/* Transaction Status Box */}
      {currentTxn && (
        <div style={{ marginTop: '1.5rem', padding: '1rem', borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>TRANSACTION STATUS</span>
            <span style={{
              padding: '0.2rem 0.6rem',
              borderRadius: 12,
              fontSize: '0.75rem',
              fontWeight: 700,
              background: currentTxn.status === 'SETTLED' ? '#dcfce7' : currentTxn.status === 'BLOCKED' || currentTxn.status === 'REJECTED' ? '#fee2e2' : '#fef9c3',
              color: currentTxn.status === 'SETTLED' ? '#166534' : currentTxn.status === 'BLOCKED' || currentTxn.status === 'REJECTED' ? '#991b1b' : '#854d0e',
            }}>
              {currentTxn.status}
            </span>
          </div>

          <div style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.6 }}>
            <div><strong>Payer:</strong> {currentTxn.sender_vpa}</div>
            <div><strong>Payee:</strong> {currentTxn.receiver_vpa}</div>
            <div><strong>Amount:</strong> ₹{currentTxn.amount.toFixed(2)}</div>
            {currentTxn.risk_score !== null && (
              <div><strong>Risk Score:</strong> {(currentTxn.risk_score * 100).toFixed(0)}%</div>
            )}
            {currentTxn.risk_reasons && currentTxn.risk_reasons.length > 0 && (
              <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                Reason: {currentTxn.risk_reasons.join(', ')}
              </div>
            )}
          </div>

          {/* Cooling Lock Controls */}
          {currentTxn.status === 'COOLING_LOCK' && (
            <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#eff6ff', borderRadius: 6, border: '1px solid #bfdbfe' }}>
              <div style={{ color: '#1e40af', fontWeight: 600, fontSize: '0.85rem' }}>
                ⏳ 20s Cooling Lock Active ({coolingSecondsLeft !== null ? `${coolingSecondsLeft}s remaining` : 'Waiting'})
              </div>
              <p style={{ margin: '0.25rem 0 0.75rem', fontSize: '0.75rem', color: '#3b82f6' }}>
                Review receiver details carefully. Payment will settle once the cooling timer expires.
              </p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => handleReleaseCooling(false)}
                  style={{ flex: 1, padding: '0.5rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  Proceed & Release
                </button>
                <button
                  onClick={() => handleReleaseCooling(true)}
                  style={{ flex: 1, padding: '0.5rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  Cancel Payment
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Audit Trail Viewer */}
      {auditTrail.length > 0 && (
        <div style={{ marginTop: '1.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
          <h4 style={{ margin: '0 0 0.75rem', color: '#334155', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            📜 Immutable Audit Trail
          </h4>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {auditTrail.map((entry, idx) => (
              <div key={idx} style={{ padding: '0.5rem 0.75rem', background: '#f8fafc', borderRadius: 6, fontSize: '0.75rem', borderLeft: '3px solid #3b82f6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#1e293b', fontWeight: 600 }}>
                  <span>{entry.from_state || 'INIT'} ➔ {entry.to_state}</span>
                  <span style={{ color: '#64748b', fontWeight: 400 }}>{new Date(entry.timestamp).toLocaleTimeString()}</span>
                </div>
                <div style={{ color: '#475569', marginTop: '0.2rem' }}>
                  <em>Actor:</em> {entry.actor} — {entry.note}
                </div>
              </div>
            ))}
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
            fetchAuditTrail(updated.txn_id);
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
            fetchAuditTrail(updated.txn_id);
          }}
          onClose={() => setShowGuardianModal(false)}
        />
      )}
    </div>
  );
}
