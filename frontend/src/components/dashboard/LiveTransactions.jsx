import React, { useState } from 'react';
import { ArrowUpRight, Search } from 'lucide-react';
import { ContextualEmptyState } from '../common/ContextualEmptyState';

export function LiveTransactions({ transactions = [], onSelectTransaction, onViewAll }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = transactions.filter((t) => {
    const matchesSearch = !searchTerm || 
      t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.payer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.payee.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.decision.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const getBrandAvatar = (item) => {
    const name = item.payee || item.payer || 'UPI';
    if (name.includes('dribbble')) return { bg: '#FDECEE', color: '#EA4C89', char: '🏀' };
    if (name.includes('google') || name.includes('okaxis')) return { bg: '#EAF8F2', color: '#108053', char: 'G' };
    if (name.includes('amazon') || name.includes('ybl')) return { bg: '#FEF4E6', color: '#FF9900', char: 'a' };
    return { bg: '#E5F7EC', color: '#0C7A53', char: '₹' };
  };

  const formatAmountINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val || 0);
  };

  return (
    <div className="quixotic-card">
      {/* Header */}
      <div className="card-header-quixotic">
        <div className="card-title-block">
          <span className="card-main-title">Payment History</span>
          <span className="card-sub-title">Recent UPI payments history</span>
        </div>
        <button 
          className="card-corner-arrow-btn" 
          aria-label="View all payments"
          onClick={onViewAll}
        >
          <ArrowUpRight size={16} />
        </button>
      </div>

      {/* Filter / Search mini bar */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search by UPI ID / Txn..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              height: '30px',
              paddingLeft: '28px',
              paddingRight: '10px',
              fontSize: '11.5px',
              borderRadius: '9999px',
              border: '1px solid var(--border-light)',
              backgroundColor: 'var(--bg-secondary)',
              outline: 'none'
            }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            height: '30px',
            fontSize: '11px',
            borderRadius: '9999px',
            border: '1px solid var(--border-light)',
            backgroundColor: 'var(--bg-secondary)',
            padding: '0 8px',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            cursor: 'pointer'
          }}
        >
          <option value="all">All Status</option>
          <option value="Approved">Approved</option>
          <option value="Blocked">Blocked</option>
          <option value="Step-up">Step-up</option>
        </select>
      </div>

      {/* List or Empty State */}
      {filtered.length === 0 ? (
        <ContextualEmptyState 
          message="No investigations recorded in current operational session."
          subtext="Telemetry index will populate as target analyses conclude."
          style={{ minHeight: '140px', padding: '20px 14px' }}
        />
      ) : (
        <div className="payment-history-list">
          {filtered.slice(0, 5).map((item) => {
            const avatar = getBrandAvatar(item);
            const isApproved = item.decision === 'Approved';
            const isBlocked = item.decision === 'Blocked';
            const statusText = isApproved ? 'Successful' : isBlocked ? 'Blocked' : 'Step-up';
            const statusClass = isApproved ? 'approved' : isBlocked ? 'blocked' : 'step-up';

            return (
              <div 
                key={item.id} 
                className="payment-history-row"
                onClick={() => onSelectTransaction?.(item)}
              >
                <div className="pay-row-left">
                  <div className="pay-avatar-box" style={{ backgroundColor: avatar.bg, color: avatar.color }}>
                    {avatar.char}
                  </div>
                  <div className="pay-info-col">
                    <div className="pay-name-row">
                      <span className="pay-name-text">{item.payee || item.payer || 'UPI Payment'}</span>
                      <span className="pay-sub-pct">Risk: {item.risk_score ?? 12}</span>
                    </div>
                    <span className="pay-datetime-text">
                      {item.timestamp || 'Just now'}
                    </span>
                  </div>
                </div>

                <div className="pay-row-right">
                  <span className="pay-amount-text tabular-nums">
                    {formatAmountINR(item.amount)}
                  </span>
                  <span className={`pay-status-tag ${statusClass}`}>
                    <span 
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: '50%',
                        backgroundColor: isApproved ? 'var(--color-success)' : isBlocked ? 'var(--color-danger)' : 'var(--color-warning)'
                      }} 
                    />
                    {statusText}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
