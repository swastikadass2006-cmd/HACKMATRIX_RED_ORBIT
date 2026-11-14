import React from 'react';
import { Activity, Search, ExternalLink } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { LoadingSkeleton, EmptyState } from '../common/LoadingSkeleton';

export function LiveTransactions({
  transactions = [],
  isLoading = false,
  searchTerm = '',
  onSearchChange,
  statusFilter = 'all',
  onStatusFilterChange,
  onSelectTransaction
}) {
  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const getScoreColor = (score) => {
    if (score >= 75) return '#E84658';
    if (score >= 40) return '#F2A629';
    return '#20B77A';
  };

  return (
    <div className="card-container">
      <div className="card-header-row">
        <div className="card-title-group">
          <Activity size={18} className="card-title-icon" />
          <h2 className="card-title">Live transactions</h2>
        </div>

        <div className="table-filter-bar" style={{ margin: 0 }}>
          <div className="table-search-box">
            <Search size={14} className="search-icon" style={{ left: 10 }} />
            <input
              type="text"
              className="table-search-input"
              placeholder="Search by transaction ID..."
              value={searchTerm}
              onChange={(e) => onSearchChange?.(e.target.value)}
            />
          </div>

          <select
            className="table-select"
            value={statusFilter}
            onChange={(e) => onStatusFilterChange?.(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="Approved">Approved</option>
            <option value="Blocked">Blocked</option>
            <option value="Step-up">Step-up</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton rows={5} />
      ) : transactions.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="transactions-table-wrapper">
          <table className="transactions-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Transaction ID</th>
                <th>Payer</th>
                <th>Payee</th>
                <th>Amount</th>
                <th>Risk score</th>
                <th>Decision</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((txn) => (
                <tr key={txn.id} onClick={() => onSelectTransaction?.(txn)}>
                  <td className="tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                    {txn.timestamp}
                  </td>
                  <td>
                    <span className="txn-id-badge">{txn.id}</span>
                  </td>
                  <td>
                    <span className="masked-upi">{txn.payer}</span>
                  </td>
                  <td>
                    <span className="masked-upi">{txn.payee}</span>
                  </td>
                  <td className="txn-amount tabular-nums">
                    {formatINR(txn.amount)}
                  </td>
                  <td>
                    <span
                      className="risk-score-badge tabular-nums"
                      style={{ color: getScoreColor(txn.risk_score) }}
                    >
                      {txn.risk_score}
                    </span>
                  </td>
                  <td>
                    <StatusBadge decision={txn.decision} />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="view-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTransaction?.(txn);
                      }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
