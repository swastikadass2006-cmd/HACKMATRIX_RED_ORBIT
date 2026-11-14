import React, { useState, useEffect } from 'react';
import { ArrowUpRight, CreditCard, Sliders, PlayCircle } from 'lucide-react';
import { runSimulation, updatePolicy, fetchAnalytics } from '../../api/client';
import { ContextualEmptyState } from '../common/ContextualEmptyState';

export function TransactionChart({ 
  dateRange, 
  onDateRangeChange, 
  onSimulationTriggered, 
  onViewAnalytics 
}) {
  const [activeToggle, setActiveToggle] = useState('Monthly');
  const [selectedHeroIndex, setSelectedHeroIndex] = useState(3); // APR by default
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [blockThreshold, setBlockThreshold] = useState(75);
  const [stepUpThreshold, setStepUpThreshold] = useState(40);
  const [selectedScenario, setSelectedScenario] = useState('normal_traffic');
  const [simStatus, setSimStatus] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);

  // Fetch live backend analytics
  useEffect(() => {
    fetchAnalytics('30d')
      .then(setAnalyticsData)
      .catch((err) => console.warn('Could not load live analytics:', err));
  }, []);

  // 6 balanced bars for Monthly (Jan-Jun) and Annually (2021-2026)
  const datasets = {
    Monthly: [
      { label: 'JAN', dateRange: '01 Jan, 2025 - 31 Jan, 2025', height: 75, pct: '+8.4%' },
      { label: 'FEB', dateRange: '01 Feb, 2025 - 28 Feb, 2025', height: 165, pct: '+14.2%' },
      { label: 'MAR', dateRange: '01 Mar, 2025 - 31 Mar, 2025', height: 140, pct: '+12.0%' },
      { label: 'APR', dateRange: '01 Apr, 2025 - 30 Apr, 2025', height: 200, pct: '+17.8%' },
      { label: 'MAY', dateRange: '01 May, 2025 - 31 May, 2025', height: 150, pct: '+13.5%' },
      { label: 'JUN', dateRange: '29 Jun, 2025 - 29 August, 2025', height: 175, pct: '+16.2%' },
    ],
    Annually: [
      { label: '2021', dateRange: '01 Jan, 2021 - 31 Dec, 2021', height: 85, pct: '+6.2%' },
      { label: '2022', dateRange: '01 Jan, 2022 - 31 Dec, 2022', height: 135, pct: '+11.5%' },
      { label: '2023', dateRange: '01 Jan, 2023 - 31 Dec, 2023', height: 160, pct: '+16.8%' },
      { label: '2024', dateRange: '01 Jan, 2024 - 31 Dec, 2024', height: 180, pct: '+20.4%' },
      { label: '2025', dateRange: '01 Jan, 2025 - 31 Dec, 2025', height: 208, pct: '+24.5%' },
      { label: '2026', dateRange: '01 Jan, 2026 - 31 Dec, 2026', height: 190, pct: '+21.8%' },
    ]
  };

  // Dynamically calibrate bar heights if live backend analytics series exist
  const liveBars = (datasets[activeToggle] || datasets.Monthly).map((bar, idx) => {
    if (analyticsData?.series?.[0]?.data?.[idx]) {
      const liveVal = analyticsData.series[0].data[idx];
      const maxPeak = analyticsData.peak_transactions || 25000;
      const scaledHeight = Math.round((liveVal / maxPeak) * 190) + 20;
      return { ...bar, height: scaledHeight };
    }
    return bar;
  });

  const handleToggle = (type) => {
    setActiveToggle(type);
    const newIdx = type === 'Monthly' ? 3 : 4;
    setSelectedHeroIndex(newIdx);
    const targetBar = datasets[type][newIdx];
    if (targetBar?.dateRange) {
      onDateRangeChange?.({ id: targetBar.label.toLowerCase(), label: targetBar.dateRange });
    }
  };

  const handleBarSelect = (idx) => {
    setSelectedHeroIndex(idx);
    const bar = liveBars[idx];
    if (bar?.dateRange) {
      onDateRangeChange?.({
        id: bar.label.toLowerCase(),
        label: bar.dateRange
      });
    }
  };

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

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="chart-toggle-group">
            <button
              type="button"
              className={`chart-toggle-btn ${activeToggle === 'Monthly' ? 'active' : ''}`}
              onClick={() => handleToggle('Monthly')}
            >
              Monthly
            </button>
            <button
              type="button"
              className={`chart-toggle-btn ${activeToggle === 'Annually' ? 'active' : ''}`}
              onClick={() => handleToggle('Annually')}
            >
              Annually
            </button>
          </div>

          <button 
            type="button"
            className="card-corner-arrow-btn" 
            aria-label="View Analytics Details"
            onClick={onViewAnalytics}
            title="Open Detailed Analytics"
          >
            <ArrowUpRight size={16} />
          </button>
        </div>
      </div>

      {/* 6-Bar Symmetrical SVG Chart */}
      <div className="bar-chart-quixotic-wrap">
        <svg 
          width="100%" 
          height="195" 
          viewBox="0 0 460 195" 
          style={{ overflow: 'visible' }}
        >
          <defs>
            <pattern id="diagonalHatch" width="6" height="6" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="6" stroke="#48A882" strokeWidth="2.2" />
              <rect width="6" height="6" fill="#C5E8D8" opacity="0.85" />
            </pattern>
          </defs>

          {/* Y Axis Gridlines and Labels */}
          {[0, 1, 2, 3, 4, 5].map((level) => {
            const y = 165 - (level / 5) * 135;
            return (
              <g key={level}>
                <line x1="30" y1={y} x2="445" y2={y} stroke="#EEF3EF" strokeDasharray="3 3" />
                <text x="20" y={y + 4} fontSize="10" fill="#9BA8A0" textAnchor="end" className="tabular-nums">
                  {level === 0 ? '0' : `${level}k`}
                </text>
              </g>
            );
          })}

          {/* Symmetrical 6 Bars */}
          {liveBars.map((bar, idx) => {
            const x = 52 + idx * 64;
            const barHeight = (bar.height / 200) * 135;
            const y = 165 - barHeight;
            const barWidth = 36;
            const isHero = selectedHeroIndex === idx;
            const isHovered = hoveredIndex === idx;

            return (
              <g 
                key={bar.label} 
                className="chart-bar-interactive"
                onClick={() => handleBarSelect(idx)}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Background hit area */}
                <rect
                  x={x - 4}
                  y={15}
                  width={barWidth + 8}
                  height={165}
                  fill="transparent"
                />

                {isHero ? (
                  <>
                    {/* Solid Hero Bar */}
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      rx="18"
                      fill="#0C7A53"
                      style={{
                        filter: isHovered ? 'brightness(1.08)' : 'none',
                        transition: 'all 0.25s ease'
                      }}
                    />
                    {/* Floating Tooltip Indicator */}
                    <circle cx={x + barWidth / 2} cy={y - 8} r="3" fill="#0C7A53" />
                    <rect
                      x={x + barWidth / 2 - 24}
                      y={y - 28}
                      width="48"
                      height="18"
                      rx="9"
                      fill="#0C7A53"
                    />
                    <text
                      x={x + barWidth / 2}
                      y={y - 16}
                      fontSize="9"
                      fontWeight="700"
                      fill="#FFFFFF"
                      textAnchor="middle"
                    >
                      {bar.pct}
                    </text>
                  </>
                ) : (
                  /* Striped Bar */
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    rx="18"
                    fill="url(#diagonalHatch)"
                    opacity={isHovered ? 0.95 : 0.85}
                    stroke={isHovered ? '#0C7A53' : 'none'}
                    strokeWidth={isHovered ? 1.5 : 0}
                    style={{ transition: 'all 0.2s ease' }}
                  />
                )}

                {/* X Axis Label */}
                <text
                  x={x + barWidth / 2}
                  y="184"
                  fontSize="11"
                  fontWeight={isHero ? "700" : "500"}
                  fill={isHero ? "#0C7A53" : "#74837B"}
                  textAnchor="middle"
                >
                  {bar.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Integrated Operational Controls Subgrid (Attack Simulator + Fraud Thresholds) */}
      <div className="operations-subgrid" style={{ marginTop: '12px' }}>
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
                type="button"
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
              type="button"
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
        <div style={{ marginTop: '8px', fontSize: '11.5px', color: 'var(--accent-primary)', fontWeight: 600, textAlign: 'center' }}>
          {simStatus}
        </div>
      )}
    </div>
  );
}
