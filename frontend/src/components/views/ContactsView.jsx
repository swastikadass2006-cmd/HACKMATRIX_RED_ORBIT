import React from 'react';
import { ArrowLeft, CheckCircle2, AlertOctagon, UserCheck } from 'lucide-react';

export function ContactsView({ onBackToDashboard }) {
  const contacts = [
    { name: 'Swiggy Food Mart', upi: 'food@ybl', bank: 'Yes Bank', trustScore: 98, status: 'Verified Merchant', risk: 'Low' },
    { name: 'Smart Bazaar Mart', upi: 'mart@ybl', bank: 'ICICI Bank', trustScore: 94, status: 'Verified Merchant', risk: 'Low' },
    { name: 'BSNL Electricity Bill', upi: 'bill@ybl', bank: 'Axis Bank', trustScore: 99, status: 'Utility Aggregator', risk: 'Low' },
    { name: 'Fastmart Online Store', upi: 'store@ybl', bank: 'State Bank of India', trustScore: 91, status: 'Verified Merchant', risk: 'Low' },
    { name: 'Unverified Mule Relay', upi: 'crypto_desk@ybl', bank: 'Unknown NBFC', trustScore: 14, status: 'NPCI Blacklist', risk: 'Critical' },
    { name: 'Rapid Split Receiver', upi: 'split_relay@ibl', bank: 'Payment Bank', trustScore: 28, status: 'Velocity Watch', risk: 'High' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
      <div className="quixotic-card" style={{ padding: '16px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
              UPI VPA Directory & Mule Watchlist
            </h2>
          </div>
        </div>
      </div>

      <div className="quixotic-card">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>Entity Name</th>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>UPI VPA Handle</th>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>Acquiring Bank</th>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>Trust Score</th>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>Risk Status</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => {
                const isDanger = c.risk === 'Critical' || c.risk === 'High';
                return (
                  <tr 
                    key={c.upi} 
                    style={{ borderBottom: '1px solid var(--border-subtle)' }}
                  >
                    <td style={{ padding: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {c.name}
                    </td>
                    <td style={{ padding: '12px', fontFamily: 'monospace', color: 'var(--accent-primary)', fontWeight: 600 }}>
                      {c.upi}
                    </td>
                    <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>
                      {c.bank}
                    </td>
                    <td style={{ padding: '12px', fontWeight: 700 }}>
                      <span className="tabular-nums" style={{ color: isDanger ? 'var(--color-danger)' : 'var(--color-success)' }}>
                        {c.trustScore}/100
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
                          backgroundColor: isDanger ? 'var(--color-danger-bg)' : 'var(--accent-mint-light)',
                          color: isDanger ? 'var(--color-danger)' : 'var(--accent-primary)'
                        }}
                      >
                        {isDanger ? <AlertOctagon size={12} /> : <CheckCircle2 size={12} />}
                        {c.status}
                      </span>
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
