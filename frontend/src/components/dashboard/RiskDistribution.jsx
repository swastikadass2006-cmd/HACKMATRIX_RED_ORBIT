import React from 'react';
import { ShieldAlert } from 'lucide-react';

export function RiskDistribution({ distributionData }) {
  const low = distributionData?.low_risk || { percentage: 72.0, count: 72 };
  const med = distributionData?.medium_risk || { percentage: 19.0, count: 19 };
  const high = distributionData?.high_risk || { percentage: 9.0, count: 9 };

  // Donut SVG circumference calculation
  const radius = 52;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius; // ~326.72

  const lowOffset = 0;
  const lowLength = (low.percentage / 100) * circumference;

  const medOffset = -lowLength;
  const medLength = (med.percentage / 100) * circumference;

  const highOffset = -(lowLength + medLength);
  const highLength = (high.percentage / 100) * circumference;

  return (
    <div className="card-container">
      <div className="card-header-row">
        <div className="card-title-group">
          <ShieldAlert size={18} className="card-title-icon" />
          <h2 className="card-title">Risk distribution</h2>
        </div>
      </div>

      <div className="donut-layout">
        <div className="donut-svg-wrapper">
          <svg viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
            {/* Background circle */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="transparent"
              stroke="#F0EFF8"
              strokeWidth={strokeWidth}
            />
            {/* Low Risk segment (Green) */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="transparent"
              stroke="#20B77A"
              strokeWidth={strokeWidth}
              strokeDasharray={`${lowLength} ${circumference}`}
              strokeDashoffset={lowOffset}
              strokeLinecap="round"
            />
            {/* Medium Risk segment (Amber) */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="transparent"
              stroke="#F2A629"
              strokeWidth={strokeWidth}
              strokeDasharray={`${medLength} ${circumference}`}
              strokeDashoffset={medOffset}
              strokeLinecap="round"
            />
            {/* High Risk segment (Red) */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="transparent"
              stroke="#E84658"
              strokeWidth={strokeWidth}
              strokeDasharray={`${highLength} ${circumference}`}
              strokeDashoffset={highOffset}
              strokeLinecap="round"
            />
          </svg>

          <div className="donut-center-label">
            <div className="donut-center-pct tabular-nums">{high.percentage}%</div>
            <div className="donut-center-text">High Risk</div>
          </div>
        </div>

        <div className="risk-breakdown-list">
          <div className="risk-breakdown-row">
            <span className="risk-tag">
              <span className="legend-bullet" style={{ backgroundColor: '#20B77A' }} />
              Low Risk
            </span>
            <span className="risk-value tabular-nums">{low.percentage}%</span>
          </div>

          <div className="risk-breakdown-row">
            <span className="risk-tag">
              <span className="legend-bullet" style={{ backgroundColor: '#F2A629' }} />
              Medium Risk
            </span>
            <span className="risk-value tabular-nums">{med.percentage}%</span>
          </div>

          <div className="risk-breakdown-row">
            <span className="risk-tag">
              <span className="legend-bullet" style={{ backgroundColor: '#E84658' }} />
              High Risk
            </span>
            <span className="risk-value tabular-nums">{high.percentage}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
