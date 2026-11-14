import React from 'react';
import { ArrowUpRight, Wifi } from 'lucide-react';
import { ContextualEmptyState } from '../common/ContextualEmptyState';

export function FraudCard({ metrics, onViewDetails }) {
  if (!metrics) {
    return (
      <div className="quixotic-card">
        <div className="card-header-quixotic">
          <div className="card-title-block">
            <span className="card-main-title">Fraud Prevention Goal</span>
            <span className="card-sub-title">Total protected UPI volume</span>
          </div>
        </div>
        <ContextualEmptyState 
          message="Telemetry index will populate as target analyses conclude."
          style={{ minHeight: '160px', padding: '24px 16px' }}
        />
      </div>
    );
  }

  const blockedFormatted = metrics?.fraud_blocked?.value_formatted || '₹5.70L';
  const fraudChangePct = metrics?.fraud_blocked?.change_percent ? `+${metrics.fraud_blocked.change_percent}%` : '+18.7%';
  const balanceDisplay = metrics?.fraud_blocked?.value_inr 
    ? `₹ ${metrics.fraud_blocked.value_inr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : '₹ 78,989.09';

  return (
    <div className="quixotic-card">
      {/* Card Header */}
      <div className="card-header-quixotic">
        <div className="card-title-block">
          <span className="card-main-title">Fraud Prevention Goal</span>
          <span className="card-sub-title">Total protected UPI volume</span>
        </div>
        <button 
          className="card-corner-arrow-btn" 
          aria-label="Details"
          onClick={onViewDetails}
        >
          <ArrowUpRight size={16} />
        </button>
      </div>

      {/* Signature Emerald Credit Card with Indian RuPay / UPI Touch */}
      <div className="emerald-credit-card">
        <div className="card-card-top">
          <div>
            <div className="card-brand-badge" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>RuPay</span>
              <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.25)', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                UPI
              </span>
            </div>
            <div className="card-type-label">Corporate Shield • Platinum</div>
          </div>
          <Wifi size={20} style={{ transform: 'rotate(90deg)' }} />
        </div>

        <div className="card-balance-large tabular-nums">
          {balanceDisplay}
        </div>

        <div className="card-card-bottom">
          <span>•••• 909090</span>
          <span>EXP 09/26</span>
        </div>
      </div>

      {/* Stat Row with Indian Rupee */}
      <div className="card-stat-pill-row">
        <div>
          <div className="stat-label-muted">Weekly Fraud Intercepted</div>
          <div className="stat-value-bold tabular-nums">+{blockedFormatted} INR</div>
        </div>

        <span className="mint-badge-pill tabular-nums">
          {fraudChangePct}
        </span>
      </div>
    </div>
  );
}
