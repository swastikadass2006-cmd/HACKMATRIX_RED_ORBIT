import React from 'react';
import { Search, Bell, Shield } from 'lucide-react';

export function Topbar({ 
  activeView = 'dashboard', 
  onSelectView, 
  unreadAlertCount = 0,
  connectionStatus = 'connected',
  searchQuery,
  onSearchChange
}) {
  const NAV_ITEMS = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'payer', label: 'UPI Payer App' },
    { id: 'scanner', label: 'ML Threat Scanner' },
    { id: 'copilot', label: 'AI Copilot' },
    { id: 'analytics', label: 'Reports' },
    { id: 'policy', label: 'Documents' },
    { id: 'transactions', label: 'History' },
    { id: 'contacts', label: 'Contacts' }
  ];

  const statusLabel = 
    connectionStatus === 'connected' ? 'Core Connected' :
    connectionStatus === 'reconnecting' ? 'Reconnecting...' : 'Disconnected';

  const dotColor = 
    connectionStatus === 'connected' ? '#16A34A' :
    connectionStatus === 'reconnecting' ? '#D97706' : '#DC2626';

  return (
    <header className="topbar-quixotic">
      {/* Brand */}
      <div 
        className="topbar-brand" 
        onClick={() => onSelectView?.('dashboard')}
        style={{ cursor: 'pointer' }}
      >
        <div className="topbar-logo-ring">
          <Shield size={18} strokeWidth={2.6} />
        </div>
        <span className="topbar-brand-name">ShieldPay</span>
      </div>

      {/* Center Nav Pills */}
      <nav className="topbar-nav-pill-group">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`topbar-nav-item ${activeView === item.id ? 'active' : ''}`}
            onClick={() => onSelectView?.(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {/* Right Circular Actions & Live Status Indicator */}
      <div className="topbar-actions">
        {/* SSE Live Status Indicator Pill */}
        <div 
          className="stream-status-pill"
          title={`Backend Telemetry Stream: ${statusLabel}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 12px',
            borderRadius: '9999px',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-light)',
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--text-secondary)'
          }}
        >
          <span 
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: dotColor,
              boxShadow: connectionStatus === 'connected' ? '0 0 6px rgba(22, 163, 74, 0.7)' : 'none',
              animation: connectionStatus === 'reconnecting' ? 'pulse 1.2s infinite' : 'none'
            }} 
          />
          <span className="stream-status-text">{statusLabel}</span>
        </div>

        <button 
          className="circle-action-btn" 
          aria-label="Search"
          onClick={() => onSelectView?.('transactions')}
          title="Search Transactions"
        >
          <Search size={16} />
        </button>

        <button 
          className="circle-action-btn" 
          aria-label="Notifications"
          onClick={() => onSelectView?.('alerts')}
          title="Security Alerts"
        >
          <Bell size={16} />
          {unreadAlertCount > 0 && <span className="unread-dot" />}
        </button>

        <div 
          className="user-avatar-circle" 
          title="Sujon (Click for Settings)"
          onClick={() => onSelectView?.('settings')}
        >
          SJ
        </div>
      </div>
    </header>
  );
}
