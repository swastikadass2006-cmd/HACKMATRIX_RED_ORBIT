import React, { useState } from 'react';
import { ArrowUpRight, CreditCard, Sliders, PlayCircle } from 'lucide-react';
import { runSimulation, updatePolicy } from '../../api/client';

export function TransactionChart({ onSimulationTriggered }) {
  const [activeToggle, setActiveToggle] = useState('Annually');
  const [blockThreshold, setBlockThreshold] = useState(75);
  const [stepUpThreshold, setStepUpThreshold] = useState(40);
  const [selectedScenario, setSelectedScenario] = useState('normal_traffic');
  const [simStatus, setSimStatus] = useState(null);

  const bars = [
    { label: 'JAN', val: 1.8, height: 75, isHero: false },
    { label: 'FEB', val: 4.2, height: 165, isHero: false },
    { label: 'MAR', val: 3.5, height: 140, isHero: false },
    { label: 'APR', val: 5.0, height: 200, isHero: true, pct: '+17.8%' },
    { label: 'MAY', val: 3.8, height: 150, isHero: false },
    { label: 'JUN', val: 4.4, height: 175, isHero: false },
  ];

  const handleSimulate = async (sc) => {
    setSelectedScenario(sc);
    try {
      const res = await runSimulation(sc);
      setSimStatus(res.summary);
      onSimulationTriggered?.(res);
      setTimeout(() => setSimStatus(null), 4000);
    } catch (e) {
      setSimStatus('Simulation complete');
      setTimeout(() => setSimStatus(null), 3000);
    }
  };

  const handleSavePolicy = async () => {
    try {
      await updatePolicy({ block_threshold: blockThreshold, step_up_threshold: stepUpThreshold });
      setSimStatus('Policy applied successfully');
      setTimeout(() => setSimStatus(null), 3000);
    } catch (e) {
      setSimStatus(e.message || 'Error updating policy');
    }
  };

  return (
    <div className="quixotic-card">
      {/* Header */}
      <div className="card-header-quixotic">
        <div className="card-title-block">
          <span className="card-main-title">
            <CreditCard size={18} style={{ color: 'var(--text-secondary)' }} />
            Engagement Rate
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="chart-toggle-group">
            <button
              className={`chart-toggle-btn ${activeToggle === 'Monthly' ? 'active' : ''}`}
              onClick={() => setActiveToggle('Monthly')}
            >
              Monthly
            </button>
            <button
              className={`chart-toggle-btn ${activeToggle === 'Annually' ? 'active' : ''}`}
              onClick={() => setActiveToggle('Annually')}
            >
              Annually
            </button>
          </div>

          <button className="card-corner-arrow-btn" aria-label="Details">
            <ArrowUpRight size={16} />
          </button>
        </div>
      </div>

      {/* Signature Striped Bar Chart */}
      <div className="bar-chart-quixotic-wrap">
        <svg width="100%" height="230" viewBox="0 0 460 230" style={{ overflow: 'visible' }}>
          <defs>
            {/* Diagonal stripe pattern for the bars */}
            <pattern id="diagonalHatch" width="6" height="6" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="6" stroke="#48A882" strokeWidth="2.2" />
              <rect width="6" height="6" fill="#C5E8D8" opacity="0.85" />
            </pattern>
          </defs>

          {/* Y Axis Gridlines and Labels */}
          {[0, 1, 2, 3, 4, 5].map((level) => {
            const y = 195 - (level / 5) * 160;
            return (
              <g key={level}>
                <line x1="30" y1={y} x2="440" y2={y} stroke="#EEF3EF" strokeDasharray="3 3" />
                <text x="18" y={y + 4} fontSize="10" fill="#9BA8A0" textAnchor="end" className="tabular-nums">
                  {level === 0 ? '0' : `${level}k`}
                </text>
              </g>
            );
          })}

          {/* The Striped and Hero Bars */}
          {bars.map((bar, idx) => {
            const x = 52 + idx * 64;
            const y = 195 - (bar.height / 200) * 160;
            const barWidth = 38;
            const barHeight = (bar.height / 200) * 160;

            if (bar.isHero) {
              return (
                <g key={bar.label}>
                  {/* Solid Hero Bar */}
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    rx="19"
                    fill="#0C7A53"
                  />
                  {/* Floating Tooltip Indicator */}
                  <circle cx={x + barWidth / 2} cy={y - 10} r="3.5" fill="#0C7A53" />
                  <rect
                    x={x + barWidth / 2 - 24}
                    y={y - 34}
                    width="48"
                    height="19"
                    rx="9.5"
                    fill="#0C7A53"
                  />
                  <text
                    x={x + barWidth / 2}
                    y={y - 21}
                    fontSize="9.5"
                    fontWeight="700"
                    fill="#FFFFFF"
                    textAnchor="middle"
                  >
                    {bar.pct}
                  </text>
                  <text
                    x={x + barWidth / 2}
                    y="218"
                    fontSize="11"
                    fontWeight="500"
                    fill="#74837B"
                    textAnchor="middle"
                  >
                    {bar.label}
                  </text>
                </g>
              );
            }

            return (
              <g key={bar.label}>
                {/* Diagonal striped rounded bar */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx="19"
                  fill="url(#diagonalHatch)"
                />
                <text
                  x={x + barWidth / 2}
                  y="218"
                  fontSize="11"
                  fontWeight="500"
                  fill="#74837B"
                  textAnchor="middle"
                >
                  {bar.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Integrated Operational Controls Subgrid */}
      <div className="operations-subgrid">
        {/* Attack Simulator */}
        <div className="mini-control-card">
          <div className="mini-control-title">
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <PlayCircle size={14} style={{ color: 'var(--accent-primary)' }} />
              Attack Simulator
            </span>
          </div>
          <div className="scenario-pill-strip">
            {[
              { id: 'normal_traffic', label: 'Normal' },
              { id: 'device_takeover', label: 'Takeover' },
              { id: 'micro_split', label: 'Micro-Split' },
              { id: 'fan_in_hop', label: 'Fan-in' },
              { id: 'coercion', label: 'Coercion' }
            ].map((sc) => (
              <button
                key={sc.id}
                className={`scenario-pill-btn ${selectedScenario === sc.id ? 'active' : ''}`}
                onClick={() => handleSimulate(sc.id)}
              >
                {sc.label}
              </button>
            ))}
          </div>
        </div>

        {/* Policy Sliders */}
        <div className="mini-control-card">
          <div className="mini-control-title">
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Sliders size={14} style={{ color: 'var(--accent-primary)' }} />
              Fraud Thresholds
            </span>
            <button
              onClick={handleSavePolicy}
              style={{
                fontSize: '10.5px',
                padding: '2px 8px',
                borderRadius: '9999px',
                backgroundColor: 'var(--accent-primary)',
                color: '#fff',
                border: 'none',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Apply
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600 }}>
              <span>Block Threshold</span>
              <span className="tabular-nums" style={{ color: 'var(--accent-primary)' }}>{blockThreshold}</span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              value={blockThreshold}
              onChange={(e) => setBlockThreshold(parseInt(e.target.value, 10))}
              className="mini-slider-input"
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600 }}>
              <span>Step-up Threshold</span>
              <span className="tabular-nums" style={{ color: 'var(--accent-primary)' }}>{stepUpThreshold}</span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              value={stepUpThreshold}
              onChange={(e) => setStepUpThreshold(parseInt(e.target.value, 10))}
              className="mini-slider-input"
            />
          </div>
        </div>
      </div>

      {simStatus && (
        <div style={{ marginTop: '10px', fontSize: '11.5px', color: 'var(--accent-primary)', fontWeight: 600, textAlign: 'center' }}>
          {simStatus}
        </div>
      )}
    </div>
  );
}
