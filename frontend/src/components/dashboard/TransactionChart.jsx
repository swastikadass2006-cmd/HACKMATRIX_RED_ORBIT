import React, { useState } from 'react';
import { BarChart3 } from 'lucide-react';

export function TransactionChart({ analyticsData, timeframe = '24h', onTimeframeChange }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const labels = analyticsData?.labels || ["12AM", "4AM", "8AM", "12PM", "4PM", "8PM", "12AM"];
  const successfulData = analyticsData?.series?.[0]?.data || [4800, 3900, 8900, 6800, 8200, 12600, 7800];
  const flaggedData = analyticsData?.series?.[1]?.data || [620, 580, 710, 840, 920, 1150, 780];

  const maxVal = Math.max(...successfulData, ...flaggedData, 15000);
  const width = 640;
  const height = 180;
  const paddingX = 40;
  const paddingBottom = 26;
  const plotWidth = width - paddingX * 2;
  const plotHeight = height - paddingBottom;

  const getCoordinates = (data) => {
    return data.map((val, idx) => {
      const x = paddingX + (idx / (data.length - 1)) * plotWidth;
      const y = plotHeight - (val / maxVal) * (plotHeight - 15);
      return { x, y, val };
    });
  };

  const succCoords = getCoordinates(successfulData);
  const flagCoords = getCoordinates(flaggedData);

  // Smooth SVG curve generator
  const createSmoothPath = (coords) => {
    if (coords.length === 0) return '';
    let d = `M ${coords[0].x},${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[i === 0 ? 0 : i - 1];
      const p1 = coords[i];
      const p2 = coords[i + 1];
      const p3 = coords[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }
    return d;
  };

  const succLinePath = createSmoothPath(succCoords);
  const flagLinePath = createSmoothPath(flagCoords);

  const succAreaPath = `${succLinePath} L ${succCoords[succCoords.length - 1].x},${plotHeight} L ${succCoords[0].x},${plotHeight} Z`;
  const flagAreaPath = `${flagLinePath} L ${flagCoords[flagCoords.length - 1].x},${plotHeight} L ${flagCoords[0].x},${plotHeight} Z`;

  return (
    <div className="card-container">
      <div className="card-header-row">
        <div className="card-title-group">
          <BarChart3 size={18} className="card-title-icon" />
          <h2 className="card-title">Transaction activity</h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="chart-legend">
            <div className="legend-item">
              <span className="legend-bullet" style={{ backgroundColor: '#5541E8' }} />
              <span>Successful</span>
            </div>
            <div className="legend-item">
              <span className="legend-bullet" style={{ backgroundColor: '#E84658' }} />
              <span>Flagged</span>
            </div>
          </div>

          <div className="timeframe-pill-group">
            {['24h', '7d', '30d'].map((t) => (
              <button
                key={t}
                className={`timeframe-pill-btn ${timeframe === t ? 'active' : ''}`}
                onClick={() => onTimeframeChange?.(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="chart-container">
        <svg className="svg-chart" viewBox={`0 0 ${width} ${height}`}>
          <defs>
            <linearGradient id="succGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5541E8" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#5541E8" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="flagGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E84658" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#E84658" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 5000, 10000, 15000].map((val) => {
            const y = plotHeight - (val / maxVal) * (plotHeight - 15);
            return (
              <g key={val}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="#EFEBF8"
                  strokeDasharray="3 3"
                />
                <text
                  x={paddingX - 10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill="#9D9BB5"
                  className="tabular-nums"
                >
                  {val === 0 ? '0' : `${val / 1000}k`}
                </text>
              </g>
            );
          })}

          {/* Area Fills */}
          <path d={succAreaPath} fill="url(#succGrad)" />
          <path d={flagAreaPath} fill="url(#flagGrad)" />

          {/* Lines */}
          <path d={succLinePath} fill="none" stroke="#5541E8" strokeWidth="2.5" strokeLinecap="round" />
          <path d={flagLinePath} fill="none" stroke="#E84658" strokeWidth="2" strokeLinecap="round" />

          {/* X Axis Labels */}
          {labels.map((lbl, idx) => {
            const x = paddingX + (idx / (labels.length - 1)) * plotWidth;
            return (
              <text
                key={idx}
                x={x}
                y={height - 6}
                textAnchor="middle"
                fontSize="11"
                fill="#74748D"
                fontWeight="500"
              >
                {lbl}
              </text>
            );
          })}

          {/* Interactive hover points */}
          {succCoords.map((pt, idx) => (
            <g 
              key={idx} 
              onMouseEnter={() => setHoveredIndex(idx)} 
              onMouseLeave={() => setHoveredIndex(null)}
              style={{ cursor: 'pointer' }}
            >
              <circle
                cx={pt.x}
                cy={pt.y}
                r={hoveredIndex === idx ? 5 : 3.5}
                fill="#FFFFFF"
                stroke="#5541E8"
                strokeWidth="2.5"
              />
              <circle
                cx={flagCoords[idx].x}
                cy={flagCoords[idx].y}
                r={hoveredIndex === idx ? 4.5 : 3}
                fill="#FFFFFF"
                stroke="#E84658"
                strokeWidth="2"
              />
            </g>
          ))}
        </svg>

        {hoveredIndex !== null && (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: `${(succCoords[hoveredIndex].x / width) * 100}%`,
              transform: 'translateX(-50%)',
              backgroundColor: '#17172F',
              color: '#FFFFFF',
              padding: '6px 10px',
              borderRadius: '6px',
              fontSize: '11.5px',
              pointerEvents: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 10
            }}
          >
            <div style={{ fontWeight: 600 }}>{labels[hoveredIndex]}</div>
            <div style={{ color: '#A094FA' }}>Successful: {succCoords[hoveredIndex].val.toLocaleString()}</div>
            <div style={{ color: '#FFA4AE' }}>Flagged: {flagCoords[hoveredIndex].val.toLocaleString()}</div>
          </div>
        )}
      </div>
    </div>
  );
}
