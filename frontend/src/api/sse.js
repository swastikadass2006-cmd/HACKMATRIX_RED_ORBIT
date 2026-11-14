export function createTransactionStream({ onTransaction, onStatusChange }) {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '';
  const streamUrl = `${API_BASE}/api/stream`;
  
  let eventSource = null;
  let reconnectTimer = null;
  let isClosed = false;

  function connect() {
    if (isClosed) return;

    try {
      onStatusChange?.({ status: 'connecting', connected: false });
      eventSource = new EventSource(streamUrl);
      
      eventSource.onopen = () => {
        onStatusChange?.({ status: 'connected', connected: true, lastConnected: new Date() });
      };

      // Handle standard Python simulator & metrics stream
      eventSource.addEventListener('transaction', (event) => {
        try {
          const data = JSON.parse(event.data);
          onTransaction?.(data);
        } catch (err) {
          console.error('Failed to parse SSE transaction:', err);
        }
      });

      // Handle Rust Axum Payments Core broadcast stream
      eventSource.addEventListener('txn.updated', (event) => {
        try {
          const raw = JSON.parse(event.data);
          const score = raw.risk_score != null 
            ? (raw.risk_score <= 1.0 ? Math.round(raw.risk_score * 100) : Math.round(raw.risk_score)) 
            : 10;
          
          const normalized = {
            id: String(raw.txn_id || raw.id),
            timestamp: new Date(raw.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            payer: raw.sender_vpa || raw.payer || 'payer@okaxis',
            payee: raw.receiver_vpa || raw.payee || 'payee@ybl',
            amount: Number(raw.amount || 0),
            risk_score: score,
            decision: raw.status || raw.decision || 'Approved',
            classification: score > 75 ? 'High Risk' : score >= 40 ? 'Medium Risk' : 'Low Risk',
            reasons: raw.risk_reasons || raw.reasons || [],
            metadata: {
              latency_ms: 0.38,
              upi_provider: 'UPI 2.0 Rails',
              ip: '103.21.244.18',
              device_os: 'Android 14'
            }
          };

          onTransaction?.(normalized);
        } catch (err) {
          console.error('Failed to parse SSE txn.updated:', err);
        }
      });

      eventSource.addEventListener('connected', () => {
        onStatusChange?.({ status: 'connected', connected: true, lastConnected: new Date() });
      });

      eventSource.onerror = () => {
        onStatusChange?.({ status: 'reconnecting', connected: false });
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        if (!isClosed) {
          reconnectTimer = setTimeout(connect, 4000);
        }
      };
    } catch (err) {
      onStatusChange?.({ status: 'reconnecting', connected: false });
      if (!isClosed) {
        reconnectTimer = setTimeout(connect, 4000);
      }
    }
  }

  connect();

  return () => {
    isClosed = true;
    onStatusChange?.({ status: 'disconnected', connected: false });
    if (reconnectTimer) clearTimeout(reconnectTimer);
    if (eventSource) eventSource.close();
  };
}
