import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export function MetricCard({ 
  title, 
  value, 
  changePercent,
  isInverse = false // For metrics like latency where decrease is positive
}) {
  const isPositive = changePercent >= 0;
  // If isInverse is true (e.g. latency), negative change is good (green), positive change is bad (red)
  const isGood = isInverse ? !isPositive : isPositive;

  return (
    <div className="kpi-card">
      <div className="kpi-top-row">
        <span className="kpi-label">{title}</span>
      </div>

      <div className="kpi-middle-row">
        <div className="kpi-value-block">
          <span className="kpi-value tabular-nums">{value}</span>
          {changePercent !== undefined && (
            <span className={`kpi-trend tabular-nums ${isGood ? 'positive' : 'negative'}`}>
              {isPositive ? (
                <ArrowUpRight size={13} strokeWidth={1.75} />
              ) : (
                <ArrowDownRight size={13} strokeWidth={1.75} />
              )}
              <span>
                {isPositive ? '+' : ''}
                {changePercent}% vs yesterday
              </span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
