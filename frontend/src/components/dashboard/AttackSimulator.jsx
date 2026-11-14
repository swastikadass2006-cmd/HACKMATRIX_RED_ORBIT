import React, { useState } from 'react';
import { Shield, AlertTriangle, Loader2 } from 'lucide-react';
import { runSimulation } from '../../api/client';

const SCENARIOS = [
  { id: 'normal_traffic', label: 'Normal Traffic' },
  { id: 'device_takeover', label: 'Device Takeover' },
  { id: 'micro_split', label: 'Micro-Split' },
  { id: 'fan_in_hop', label: 'Fan-in / Hop' },
  { id: 'coercion', label: 'Coercion' }
];

export function AttackSimulator({ onSimulationResult }) {
  const [selectedScenario, setSelectedScenario] = useState('normal_traffic');
  const [isRunning, setIsRunning] = useState(false);
  const [resultMessage, setResultMessage] = useState(null);

  const handleSimulate = async (scenarioId) => {
    const target = scenarioId || selectedScenario;
    setSelectedScenario(target);
    setIsRunning(true);
    setResultMessage(null);

    try {
      const res = await runSimulation(target);
      setResultMessage({
        type: res.transaction.decision === 'Approved' ? 'success' : 'blocked',
        summary: res.summary
      });
      onSimulationResult?.(res);
      setTimeout(() => setResultMessage(null), 5000);
    } catch (err) {
      setResultMessage({
        type: 'error',
        summary: err.message || 'Simulation request failed'
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="card-container">
      <div className="card-header-row" style={{ marginBottom: 10 }}>
        <div className="card-title-group">
          <h2 className="card-title">Attack simulator</h2>
        </div>
      </div>

      <div className="scenario-button-grid">
        {SCENARIOS.map((sc) => (
          <button
            key={sc.id}
            className={`scenario-btn ${selectedScenario === sc.id ? 'active' : ''}`}
            onClick={() => handleSimulate(sc.id)}
            disabled={isRunning}
          >
            {sc.label}
          </button>
        ))}
      </div>

      {isRunning && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '11.5px', color: 'var(--text-muted)', padding: '4px' }}>
          <Loader2 size={13} className="animate-spin" />
          <span>Injecting UPI payload to risk engine...</span>
        </div>
      )}

      {resultMessage && (
        <div
          style={{
            fontSize: '11.5px',
            borderRadius: '4px',
            padding: '6px 8px',
            backgroundColor: resultMessage.type === 'success' ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
            border: `1px solid ${resultMessage.type === 'success' ? 'var(--color-success-border)' : 'var(--color-danger-border)'}`,
            color: resultMessage.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: 500
          }}
        >
          {resultMessage.type === 'success' ? <Shield size={14} /> : <AlertTriangle size={14} />}
          <span>{resultMessage.summary}</span>
        </div>
      )}
    </div>
  );
}
