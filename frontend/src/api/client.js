const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export async function fetchMetrics() {
  const res = await fetch(`${API_BASE}/api/metrics`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch metrics`);
  return res.json();
}

export async function fetchAnalytics(timeframe = '24h') {
  const res = await fetch(`${API_BASE}/api/analytics?timeframe=${timeframe}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch analytics`);
  return res.json();
}

export async function fetchRiskDistribution() {
  const res = await fetch(`${API_BASE}/api/risk/distribution`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch risk distribution`);
  return res.json();
}

export async function fetchTransactions({ search = '', status = 'all', page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (status && status !== 'all') params.set('status', status);
  params.set('page', page);
  params.set('limit', limit);

  const res = await fetch(`${API_BASE}/api/transactions?${params.toString()}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch transactions`);
  return res.json();
}

export async function fetchTransactionDetails(id) {
  const res = await fetch(`${API_BASE}/api/transactions/${id}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch transaction details`);
  return res.json();
}

export async function fetchPolicy() {
  const res = await fetch(`${API_BASE}/api/policy`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch policy`);
  return res.json();
}

export async function updatePolicy(policy) {
  const res = await fetch(`${API_BASE}/api/policy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(policy)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `HTTP ${res.status}: Failed to update policy`);
  }
  return res.json();
}

export async function runSimulation(scenario) {
  const res = await fetch(`${API_BASE}/api/simulator/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenario })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `HTTP ${res.status}: Simulation failed`);
  }
  return res.json();
}

export async function fetchAlerts() {
  const res = await fetch(`${API_BASE}/api/alerts`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch alerts`);
  return res.json();
}

export async function checkHealth() {
  const res = await fetch(`${API_BASE}/api/health`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: Health check failed`);
  return res.json();
}

export async function analyzeThreat(payload) {
  const res = await fetch(`${API_BASE}/api/threat/analyze-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `HTTP ${res.status}: Threat analysis failed`);
  }
  return res.json();
}

export async function analyzeThreatMessage(payload) {
  const res = await fetch(`${API_BASE}/api/threat/analyze-message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `HTTP ${res.status}: Message analysis failed`);
  }
  return res.json();
}

export async function fetchRecentScans() {
  const res = await fetch(`${API_BASE}/api/threat/recent`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch recent scans`);
  return res.json();
}

export async function sendAiChat(payload) {
  const res = await fetch(`${API_BASE}/api/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `HTTP ${res.status}: AI Chat request failed`);
  }
  return res.json();
}

export async function commitThreatReport(payload) {
  const res = await fetch(`${API_BASE}/api/threat/commit-report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `HTTP ${res.status}: Web3 report commitment failed`);
  }
  return res.json();
}

export async function verifyThreatReport(reportHash) {
  const res = await fetch(`${API_BASE}/api/threat/commit-report/${encodeURIComponent(reportHash)}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `HTTP ${res.status}: Failed to verify Web3 commitment`);
  }
  return res.json();
}
