import React, { useState } from 'react';
import { PlayCircle, ShieldCheck, AlertTriangle, Loader2 } from 'lucide-react';
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
      <div className="card-header-row" style={{ marginBottom: 12 }}>
        <div className="card-title-group">
          <PlayCircle size={18} className="card-title-icon" style={{ color: '#20B77A' }} />
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)', padding: '6px' }}>
          <Loader2 size={14} className="animate-spin" />
          <span>Injecting simulated UPI payload to risk engine...</span>
        </div>
      )}

      {resultMessage && (
        <div
          style={{
            fontSize: '12px',
            borderRadius: '6px',
            padding: '8px 10px',
            backgroundColor: resultMessage.type === 'success' ? 'var(--color-success-bg)' : resultMessage.type === 'blocked' ? 'var(--color-danger-bg)' : '#FFF3F3',
            color: resultMessage.type === 'success' ? '#108053' : 'var(--color-danger)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 500
          }}
        >
          {resultMessage.type === 'success' ? <ShieldCheck size={16} /> : <AlertTriangle size={16} />}
          <span>{resultMessage.summary}</span>
        </div>
      )}
    </div>
  );
}
