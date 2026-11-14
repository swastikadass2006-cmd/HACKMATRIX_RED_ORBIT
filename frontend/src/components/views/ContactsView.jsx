import React from 'react';
import { ArrowLeft, CheckCircle2, AlertOctagon, UserCheck } from 'lucide-react';
import { ContextualEmptyState } from '../common/ContextualEmptyState';

export function ContactsView({ transactions = [], onBackToDashboard }) {
  // Derive live VPA directory from real transaction telemetry
  const contactMap = new Map();

  transactions.forEach((t) => {
    if (t.payee && !contactMap.has(t.payee)) {
      const isHighRisk = (t.risk_score || 0) >= 70;
      const isMedRisk = (t.risk_score || 0) >= 40 && (t.risk_score || 0) < 70;
      const bank = t.payee.includes('@') ? t.payee.split('@')[1].toUpperCase() + ' Node' : 'UPI Node';
      contactMap.set(t.payee, {
        name: t.payee.split('@')[0].replace(/_/g, ' ').toUpperCase(),
        upi: t.payee,
        bank,
        trustScore: Math.max(5, 100 - (t.risk_score || 10)),
        risk: isHighRisk ? 'Critical' : isMedRisk ? 'Warning' : 'Low',
        status: isHighRisk ? 'Suspicious Mule' : isMedRisk ? 'Step-up Verified' : 'Verified Counterparty'
      });
    }
  });

  const contacts = Array.from(contactMap.values());

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
        {contacts.length === 0 ? (
          <ContextualEmptyState 
            message="No investigations recorded in current operational session."
            subtext="Telemetry index will populate as target analyses conclude."
          />
        ) : (
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
        )}
      </div>
    </div>
  );
}
