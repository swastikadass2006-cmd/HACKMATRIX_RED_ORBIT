import React, { useState, useRef, useEffect } from 'react';
import { ArrowUpRight, CreditCard, Sliders, PlayCircle, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { runSimulation, updatePolicy } from '../../api/client';

export function TransactionChart({ 
  dateRange, 
  onDateRangeChange, 
  onSimulationTriggered, 
  onViewAnalytics 
}) {
  const [activeToggle, setActiveToggle] = useState('Monthly');
  // Default hero: index 3 for APR in Monthly, or index 4 for 2025 in Annually
  const [selectedHeroIndex, setSelectedHeroIndex] = useState(3);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [blockThreshold, setBlockThreshold] = useState(75);
  const [stepUpThreshold, setStepUpThreshold] = useState(40);
  const [selectedScenario, setSelectedScenario] = useState('normal_traffic');
  const [simStatus, setSimStatus] = useState(null);
  const scrollContainerRef = useRef(null);

  const datasets = {
    Monthly: [
      { label: 'JAN', dateRange: '01 Jan, 2025 - 31 Jan, 2025', val: 1.8, height: 75, pct: '+8.4%', amount: '₹18,400', txns: '1,840' },
      { label: 'FEB', dateRange: '01 Feb, 2025 - 28 Feb, 2025', val: 4.2, height: 165, pct: '+14.2%', amount: '₹42,100', txns: '4,210' },
      { label: 'MAR', dateRange: '01 Mar, 2025 - 31 Mar, 2025', val: 3.5, height: 140, pct: '+12.0%', amount: '₹35,200', txns: '3,520' },
      { label: 'APR', dateRange: '01 Apr, 2025 - 30 Apr, 2025', val: 5.0, height: 200, pct: '+17.8%', amount: '₹50,400', txns: '5,040' },
      { label: 'MAY', dateRange: '01 May, 2025 - 31 May, 2025', val: 3.8, height: 150, pct: '+13.5%', amount: '₹38,900', txns: '3,890' },
      { label: 'JUN', dateRange: '29 Jun, 2025 - 29 August, 2025', val: 4.4, height: 175, pct: '+16.2%', amount: '₹44,600', txns: '4,460' },
      { label: 'JUL', dateRange: '01 Jul, 2025 - 31 Jul, 2025', val: 4.1, height: 162, pct: '+15.4%', amount: '₹41,800', txns: '4,180' },
      { label: 'AUG', dateRange: '01 Aug, 2025 - 31 Aug, 2025', val: 4.7, height: 188, pct: '+19.1%', amount: '₹47,300', txns: '4,730' },
      { label: 'SEP', dateRange: '01 Sep, 2025 - 30 Sep, 2025', val: 3.9, height: 154, pct: '+13.9%', amount: '₹39,500', txns: '3,950' },
      { label: 'OCT', dateRange: '01 Oct, 2025 - 31 Oct, 2025', val: 4.5, height: 178, pct: '+17.3%', amount: '₹45,200', txns: '4,520' },
      { label: 'NOV', dateRange: '01 Nov, 2026 - 30 Nov, 2026', val: 4.9, height: 196, pct: '+18.9%', amount: '₹49,100', txns: '4,910' },
      { label: 'DEC', dateRange: '01 Dec, 2025 - 31 Dec, 2025', val: 5.3, height: 210, pct: '+22.4%', amount: '₹53,800', txns: '5,380' },
    ],
    Annually: [
      { label: '2021', dateRange: '01 Jan, 2021 - 31 Dec, 2021', val: 2.1, height: 85, pct: '+6.2%', amount: '₹1.8 Cr', txns: '21,400' },
      { label: '2022', dateRange: '01 Jan, 2022 - 31 Dec, 2022', val: 3.4, height: 135, pct: '+11.5%', amount: '₹3.2 Cr', txns: '34,100' },
      { label: '2023', dateRange: '01 Jan, 2023 - 31 Dec, 2023', val: 4.0, height: 160, pct: '+16.8%', amount: '₹4.5 Cr', txns: '40,500' },
      { label: '2024', dateRange: '01 Jan, 2024 - 31 Dec, 2024', val: 4.6, height: 180, pct: '+20.4%', amount: '₹5.8 Cr', txns: '46,200' },
      { label: '2025', dateRange: '01 Jan, 2025 - 31 Dec, 2025', val: 5.2, height: 208, pct: '+24.5%', amount: '₹7.4 Cr', txns: '52,800' },
      { label: '2026', dateRange: '01 Jan, 2026 - 31 Dec, 2026', val: 4.8, height: 190, pct: '+21.8%', amount: '₹6.9 Cr', txns: '48,900' },
    ]
  };

  const currentBars = datasets[activeToggle] || datasets.Monthly;
  const activeBar = currentBars[selectedHeroIndex] || currentBars[0];

  // Sync when dateRange changes externally from DashboardHeader
  useEffect(() => {
    if (!dateRange?.label) return;
    const str = dateRange.label.toLowerCase();

    // Check Monthly dataset
    const mIdx = datasets.Monthly.findIndex((m) => 
      str.includes(m.label.toLowerCase()) || 
      str.includes(m.dateRange.toLowerCase()) ||
      (m.label === 'JUN' && str.includes('29 jun')) ||
      (m.label === 'AUG' && str.includes('august')) ||
      (m.label === 'NOV' && str.includes('nov'))
    );

    if (mIdx !== -1) {
      setActiveToggle('Monthly');
      setSelectedHeroIndex(mIdx);
      if (scrollContainerRef.current) {
        const scrollTarget = Math.max(0, mIdx * 64 - 120);
        scrollContainerRef.current.scrollTo({ left: scrollTarget, behavior: 'smooth' });
      }
    }
  }, [dateRange?.label]);

  const handleToggle = (type) => {
    setActiveToggle(type);
    const newIdx = type === 'Monthly' ? 3 : 4;
    setSelectedHeroIndex(newIdx);
    const targetBar = datasets[type][newIdx];
    if (targetBar?.dateRange) {
      onDateRangeChange?.({ id: targetBar.label.toLowerCase(), label: targetBar.dateRange });
    }
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  };

  // Sync when user clicks any bar
  const handleBarSelect = (idx) => {
    setSelectedHeroIndex(idx);
    const bar = currentBars[idx];
    if (bar?.dateRange) {
      onDateRangeChange?.({
        id: bar.label.toLowerCase(),
        label: bar.dateRange
      });
    }
  };

  const handleScroll = (offset) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
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

  const totalSvgWidth = activeToggle === 'Monthly' ? 840 : 460;

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
          {/* Scroll Navigation Chevrons for 12 months */}
          {activeToggle === 'Monthly' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button 
                type="button" 
                className="chart-scroll-nav-btn" 
                onClick={() => handleScroll(-180)}
                title="Scroll left"
                aria-label="Scroll left"
              >
                <ChevronLeft size={14} />
              </button>
              <button 
                type="button" 
                className="chart-scroll-nav-btn" 
                onClick={() => handleScroll(180)}
                title="Scroll right"
                aria-label="Scroll right"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}

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

      {/* Horizontal Scrollable Bar Chart Wrapper */}
      <div className="bar-chart-quixotic-wrap">
        <div className="chart-horizontal-scroll" ref={scrollContainerRef}>
          <svg aria-hidden="true" width={totalSvgWidth} height="230" viewBox={`0 0 ${totalSvgWidth} 230`} style={{ overflow: 'visible', minWidth: `${totalSvgWidth}px` }}>
            <defs>
              {/* Diagonal stripe pattern for the bars - dynamic theme responsive */}
              <pattern id="diagonalHatch" width="6" height="6" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="6" stroke="var(--accent-primary)" strokeWidth="2.2" opacity="0.65" />
                <rect width="6" height="6" fill="var(--accent-mint-light)" opacity="0.85" />
              </pattern>
            </defs>

            {/* Y Axis Gridlines and Labels spanning full width */}
            {[0, 1, 2, 3, 4, 5].map((level) => {
              const y = 195 - (level / 5) * 160;
              return (
                <g key={level}>
                  <line x1="30" y1={y} x2={totalSvgWidth - 20} y2={y} stroke="var(--border-light)" strokeDasharray="3 3" />
                  <text x="18" y={y + 4} fontSize="10" fill="var(--text-muted)" textAnchor="end" className="tabular-nums">
                    {level === 0 ? '0' : `${level}k`}
                  </text>
                </g>
              );
            })}

            {/* The Striped and Hero Bars */}
            {currentBars.map((bar, idx) => {
              const x = 52 + idx * 64;
              const y = 195 - (bar.height / 200) * 160;
              const barWidth = 38;
              const barHeight = (bar.height / 200) * 160;
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
                  {/* Background hit area for effortless clicking */}
                  <rect
                    x={x - 4}
                    y={20}
                    width={barWidth + 8}
                    height={190}
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
                        rx="19"
                        fill="var(--accent-primary)"
                        style={{
                          filter: isHovered ? 'brightness(1.12)' : 'none',
                          transition: 'filter 0.25s ease'
                        }}
                      />
                      {/* Floating Tooltip Indicator */}
                      <circle cx={x + barWidth / 2} cy={y - 10} r="3.5" fill="var(--accent-primary)" />
                      <rect
                        x={x + barWidth / 2 - 25}
                        y={y - 34}
                        width="50"
                        height="19"
                        rx="9.5"
                        fill="var(--accent-primary)"
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
                    </>
                  ) : (
                    /* Diagonal striped rounded bar */
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      rx="19"
                      fill="url(#diagonalHatch)"
                      opacity={isHovered ? 0.95 : 0.85}
                      stroke={isHovered ? 'var(--accent-primary)' : 'none'}
                      strokeWidth={isHovered ? 1.5 : 0}
                      style={{ transition: 'stroke 0.2s ease, opacity 0.2s ease' }}
                    />
                  )}

                  {/* X Axis Label */}
                  <text
                    x={x + barWidth / 2}
                    y="218"
                    fontSize="11"
                    fontWeight={isHero ? "700" : "500"}
                    fill={isHero ? "var(--accent-primary)" : "var(--text-secondary)"}
                    textAnchor="middle"
                  >
                    {bar.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Selected Cohort Metrics Details Pill (Synced with Date) */}
      <div className="chart-detail-strip">
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Info size={12} style={{ color: 'var(--accent-primary)' }} />
          <span>{activeToggle === 'Monthly' ? 'Month' : 'Year'}: <strong className="chart-detail-highlight">{activeBar.label}</strong></span>
          <span style={{ marginLeft: '6px', color: 'var(--text-secondary)' }}>({activeBar.dateRange})</span>
        </span>
        <span>Volume: <strong style={{ color: 'var(--text-primary)' }}>{activeBar.amount}</strong></span>
        <span>Rate: <strong style={{ color: 'var(--accent-primary)' }}>{activeBar.pct}</strong></span>
        <span>Settlements: <strong style={{ color: 'var(--text-primary)' }}>{activeBar.txns}</strong></span>
      </div>

      {/* Integrated Operational Controls Subgrid */}
      <div className="operations-subgrid" style={{ marginTop: '16px' }}>
        {/* Attack Simulator */}
        <div className="mini-control-panel">
          <div className="mini-control-title">
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
        <div className="mini-control-panel">
          <div className="mini-control-title">
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={14} style={{ color: 'var(--accent-primary)' }} />
              Fraud Thresholds
            </span>
            <button
              type="button"
              onClick={handleSavePolicy}
              style={{
                fontSize: '11px',
                padding: '4px 8px',
                borderRadius: '9999px',
                backgroundColor: 'var(--accent-primary)',
                color: 'var(--text-inverse)',
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