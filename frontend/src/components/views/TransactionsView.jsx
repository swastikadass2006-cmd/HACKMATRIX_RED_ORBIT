import React, { useState } from 'react';
import { Search, Filter, RefreshCw, Activity, ArrowLeft } from 'lucide-react';

export function TransactionsView({ transactions = [], onSelectTransaction, onBackToDashboard }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = transactions.filter((t) => {
    const matchesSearch = !search ||
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.payer.toLowerCase().includes(search.toLowerCase()) ||
      t.payee.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.decision.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val || 0);
  };

  const getStatusColor = (decision) => {
    if (decision === 'Approved') return { text: '#0C7A53', bg: '#E5F7EC' };
    if (decision === 'Blocked') return { text: '#DA3A49', bg: '#FDECEE' };
    return { text: '#D98218', bg: '#FEF4E6' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
      {/* Top Controls Bar */}
      <div className="quixotic-card" style={{ padding: '16px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              className="pill-action-btn"
              onClick={onBackToDashboard}
              style={{ padding: '6px 14px', fontSize: '12px' }}
            >
              <ArrowLeft size={14} />
              <span>Back to Dashboard</span>
            </button>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
              UPI Transaction History & Stream
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ position: 'relative', width: '260px' }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search Txn ID or UPI..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  height: '34px',
                  paddingLeft: '32px',
                  paddingRight: '12px',
                  borderRadius: '9999px',
                  border: '1px solid var(--border-light)',
                  backgroundColor: 'var(--bg-secondary)',
                  fontSize: '12px',
                  outline: 'none'
                }}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                height: '34px',
                padding: '0 12px',
                borderRadius: '9999px',
                border: '1px solid var(--border-light)',
                backgroundColor: 'var(--bg-secondary)',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Decisions</option>
              <option value="Approved">Approved Only</option>
              <option value="Blocked">Blocked Only</option>
              <option value="Step-up">Step-up Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="quixotic-card" style={{ padding: '20px 24px' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>Timestamp</th>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>Transaction ID</th>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>Payer VPA</th>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>Payee VPA</th>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>Amount (₹ INR)</th>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>Risk Score</th>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>Decision</th>
                <th style={{ padding: '10px 12px', fontWeight: 600, textAlign: 'right' }}>Inspection</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((txn) => {
                const s = getStatusColor(txn.decision);
                return (
                  <tr 
                    key={txn.id}
                    onClick={() => onSelectTransaction?.(txn)}
                    style={{ borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer', transition: 'background-color 0.15s' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ padding: '12px', color: 'var(--text-secondary)' }} className="tabular-nums">
                      {txn.timestamp}
                    </td>
                    <td style={{ padding: '12px', fontFamily: 'monospace', fontWeight: 600, color: 'var(--accent-primary)' }}>
                      {txn.id}
                    </td>
                    <td style={{ padding: '12px', fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                      {txn.payer}
                    </td>
                    <td style={{ padding: '12px', fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                      {txn.payee}
                    </td>
                    <td style={{ padding: '12px', fontWeight: 700, color: 'var(--text-primary)' }} className="tabular-nums">
                      {formatINR(txn.amount)}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span className="tabular-nums" style={{ fontWeight: 700, color: s.text }}>
                        {txn.risk_score}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span 
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '3px 8px',
                          borderRadius: '9999px',
                          fontSize: '11px',
                          fontWeight: 700,
                          backgroundColor: s.bg,
                          color: s.text
                        }}
                      >
                        ● {txn.decision}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <button
                        style={{
                          padding: '4px 10px',
                          borderRadius: '9999px',
                          border: '1px solid var(--border-light)',
                          backgroundColor: '#FFFFFF',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: 'var(--accent-primary)',
                          cursor: 'pointer'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTransaction?.(txn);
                        }}
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
