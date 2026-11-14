import React, { useState } from 'react';
import { ArrowLeft, PlayCircle, ShieldCheck, AlertTriangle, Loader2 } from 'lucide-react';
import { runSimulation } from '../../api/client';

export function SimulatorView({ onBackToDashboard, onSimulationDone }) {
  const [running, setRunning] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState('normal_traffic');
  const [result, setResult] = useState(null);

  const scenarios = [
    { id: 'normal_traffic', name: 'Normal Traffic', desc: 'Legitimate peer-to-peer and merchant payments with normal velocity', target: 'Low Risk' },
    { id: 'device_takeover', name: 'Device Takeover', desc: 'New hardware ID and sudden geo-velocity jump after SIM swap', target: 'High Risk (Blocked)' },
    { id: 'micro_split', name: 'Micro-Split', desc: 'Burst of small transfers to circumvent automated single-transaction limits', target: 'Medium Risk (Step-up)' },
    { id: 'fan_in_hop', name: 'Fan-in / Hop', desc: 'Multiple compromised payers routing funds into a single mule node', target: 'High Risk (Blocked)' },
    { id: 'coercion', name: 'Coercion', desc: 'Active phone call detected during non-habitual night transfer with PIN override', target: 'High Risk (Blocked)' }
  ];

  const handleSimulate = async (scId) => {
    setSelectedScenario(scId);
    setRunning(true);
    setResult(null);
    try {
      const res = await runSimulation(scId);
      setResult(res);
      onSimulationDone?.(res);
    } catch (e) {
      setResult({ summary: e.message || 'Simulation execution failed' });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
      <div className="quixotic-card" style={{ padding: '16px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              className="pill-action-btn"
              onClick={onBackToDashboard}
              style={{ padding: '6px 14px', fontSize: '12px' }}
            >
              <ArrowLeft size={14} />
              <span>Back to Dashboard</span>
            </button>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Attack Simulation & Adversarial Testing Studio
            </h2>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Scenario Selection */}
        <div className="quixotic-card">
          <div className="card-header-quixotic">
            <div className="card-title-block">
              <span className="card-main-title" style={{ gap: '6px' }}>
                <PlayCircle size={16} style={{ color: 'var(--accent-primary)' }} />
                Select Simulation Vector
              </span>
              <span className="card-sub-title">Inject real-time adversarial payloads</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
            {scenarios.map((sc) => {
              const isSelected = selectedScenario === sc.id;
              return (
                <div
                  key={sc.id}
                  onClick={() => handleSimulate(sc.id)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '14px',
                    backgroundColor: isSelected ? 'var(--accent-mint-light)' : 'var(--bg-secondary)',
                    border: `1.5px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-light)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {sc.name}
                    </span>
                    <span className="mint-badge-pill" style={{ fontSize: '10.5px' }}>
                      {sc.target}
                    </span>
                  </div>
                  <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {sc.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Execution Output */}
        <div className="quixotic-card">
          <div className="card-header-quixotic">
            <div className="card-title-block">
              <span className="card-main-title">Simulation Evaluation Results</span>
              <span className="card-sub-title">Live FastAPI risk engine response</span>
            </div>
          </div>

          {running ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--accent-primary)' }} />
              <p style={{ fontWeight: 600 }}>Injecting simulated UPI payload to FastAPI risk engine...</p>
            </div>
          ) : result ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
              <div 
                style={{
                  padding: '14px',
                  borderRadius: '14px',
                  backgroundColor: result.transaction?.decision === 'Approved' ? 'var(--accent-mint-light)' : 'var(--color-danger-bg)',
                  color: result.transaction?.decision === 'Approved' ? 'var(--accent-primary)' : 'var(--color-danger)',
                  fontWeight: 700,
                  fontSize: '13px'
                }}
              >
                {result.summary}
              </div>

              {result.transaction && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Transaction ID:</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{result.transaction.id}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Evaluated Risk Score:</span>
                    <span style={{ fontWeight: 700 }}>{result.transaction.risk_score} / 100</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Simulated Transfer Amount:</span>
                    <span style={{ fontWeight: 700 }} className="tabular-nums">₹ {result.transaction.amount?.toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Payer / Payee:</span>
                    <span style={{ fontFamily: 'monospace' }}>{result.transaction.payer} → {result.transaction.payee}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
              Click any attack scenario on the left to execute a live simulation.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
