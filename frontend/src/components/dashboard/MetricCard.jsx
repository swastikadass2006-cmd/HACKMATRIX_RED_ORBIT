import React from 'react';
import { ArrowUpRight, ArrowDownRight, ArrowLeftRight, Shield, Ban, Zap } from 'lucide-react';

export function MetricCard({ 
  type = 'transactions',
  title, 
  value, 
  changePercent, 
  sparkline = [] 
}) {
  const isPositive = changePercent >= 0;

  const renderIcon = () => {
    switch (type) {
      case 'transactions':
        return (
          <div className="kpi-icon-pill purple">
            <ArrowLeftRight size={16} />
          </div>
        );
      case 'flagged':
        return (
          <div className="kpi-icon-pill yellow">
            <Shield size={16} />
          </div>
        );
      case 'blocked':
        return (
          <div className="kpi-icon-pill red">
            <Ban size={16} />
          </div>
        );
      case 'latency':
        return (
          <div className="kpi-icon-pill blue">
            <Zap size={16} />
          </div>
        );
      default:
        return null;
    }
  };

  // Sparkline SVG path generation
  const renderSparkline = () => {
    if (!sparkline || sparkline.length < 2) return null;

    const width = 100;
    const height = 36;
    const min = Math.min(...sparkline);
    const max = Math.max(...sparkline);
    const range = max - min || 1;

    const points = sparkline.map((val, idx) => {
      const x = (idx / (sparkline.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 8) - 4;
      return `${x},${y}`;
    });

    const pathD = `M ${points.join(' L ')}`;
    const strokeColor = type === 'blocked' ? '#E84658' : type === 'flagged' ? '#F2A629' : '#5541E8';

    return (
      <svg className="kpi-sparkline" viewBox={`0 0 ${width} ${height}`}>
        <path
          d={pathD}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  return (
    <div className="kpi-card">
      <div className="kpi-top-row">
        <span className="kpi-label">{title}</span>
        {renderIcon()}
      </div>

      <div className="kpi-middle-row">
        <div className="kpi-value-block">
          <span className="kpi-value tabular-nums">{value}</span>
          {changePercent !== undefined && (
            <span className={`kpi-trend tabular-nums ${isPositive ? 'positive' : 'negative'}`}>
              {isPositive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
              <span>{Math.abs(changePercent)}% from yesterday</span>
            </span>
          )}
        </div>
        {renderSparkline()}
      </div>
    </div>
  );
}
