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

      eventSource.addEventListener('transaction', (event) => {
        try {
          const data = JSON.parse(event.data);
          onTransaction?.(data);
        } catch (err) {
          console.error('Failed to parse SSE transaction:', err);
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
