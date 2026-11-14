import React from 'react';

export function RiskDistribution({ distributionData }) {
  const low = distributionData?.low_risk || { percentage: 72.0, count: 72 };
  const med = distributionData?.medium_risk || { percentage: 19.0, count: 19 };
  const high = distributionData?.high_risk || { percentage: 9.0, count: 9 };

  // Donut SVG circumference calculation
  const radius = 48;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius; // ~301.59

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
          <h2 className="card-title">Risk distribution</h2>
        </div>
      </div>

      <div className="donut-layout">
        <div className="donut-svg-wrapper">
          <svg viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
            {/* Background circle */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="transparent"
              stroke="#F1F5F9"
              strokeWidth={strokeWidth}
            />
            {/* Low Risk segment */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="transparent"
              stroke="#16A34A"
              strokeWidth={strokeWidth}
              strokeDasharray={`${lowLength} ${circumference}`}
              strokeDashoffset={lowOffset}
            />
            {/* Medium Risk segment */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="transparent"
              stroke="#D97706"
              strokeWidth={strokeWidth}
              strokeDasharray={`${medLength} ${circumference}`}
              strokeDashoffset={medOffset}
            />
            {/* High Risk segment */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="transparent"
              stroke="#DC2626"
              strokeWidth={strokeWidth}
              strokeDasharray={`${highLength} ${circumference}`}
              strokeDashoffset={highOffset}
            />
          </svg>

          <div className="donut-center-label">
            <div className="donut-center-pct tabular-nums">{high.percentage}%</div>
            <div className="donut-center-text">High risk</div>
          </div>
        </div>

        <div className="risk-breakdown-list">
          <div className="risk-breakdown-row">
            <span className="risk-tag">
              <span className="legend-bullet" style={{ backgroundColor: '#16A34A' }} />
              Low risk
            </span>
            <span className="risk-value tabular-nums">{low.percentage}%</span>
          </div>

          <div className="risk-breakdown-row">
            <span className="risk-tag">
              <span className="legend-bullet" style={{ backgroundColor: '#D97706' }} />
              Medium risk
            </span>
            <span className="risk-value tabular-nums">{med.percentage}%</span>
          </div>

          <div className="risk-breakdown-row">
            <span className="risk-tag">
              <span className="legend-bullet" style={{ backgroundColor: '#DC2626' }} />
              High risk
            </span>
            <span className="risk-value tabular-nums">{high.percentage}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
