import React from 'react';
import { ArrowUpRight, Wifi } from 'lucide-react';

export function FraudCard({ metrics }) {
  const blockedFormatted = metrics?.fraud_blocked?.value_formatted || '₹4,82,500';
  const transactionsToday = metrics?.transactions_today?.value?.toLocaleString() || '24,780';

  return (
    <div className="quixotic-card">
      {/* Card Header */}
      <div className="card-header-quixotic">
        <div className="card-title-block">
          <span className="card-main-title">Payment Goal</span>
          <span className="card-sub-title">Total amount goal</span>
        </div>
        <button className="card-corner-arrow-btn" aria-label="Details">
          <ArrowUpRight size={16} />
        </button>
      </div>

      {/* Signature Emerald Credit Card */}
      <div className="emerald-credit-card">
        <div className="card-card-top">
          <div>
            <div className="card-brand-badge">VISA</div>
            <div className="card-type-label">Credit Card</div>
          </div>
          <Wifi size={20} style={{ transform: 'rotate(90deg)' }} />
        </div>

        <div className="card-balance-large tabular-nums">
          $ 78,989.09
        </div>

        <div className="card-card-bottom">
          <span>•••• 909090</span>
          <span>EXP 09/26</span>
        </div>
      </div>

      {/* Stat Row */}
      <div className="card-stat-pill-row">
        <div>
          <div className="stat-label-muted">Weekly Revenue</div>
          <div className="stat-value-bold tabular-nums">+3,945 USD</div>
        </div>

        <span className="mint-badge-pill tabular-nums">
          +12.8%
        </span>
      </div>
    </div>
  );
}
