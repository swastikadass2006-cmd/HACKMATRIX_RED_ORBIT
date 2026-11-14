import React from 'react';
import { Search, Bell, Shield, Sun, Moon } from 'lucide-react';

export function Topbar({ 
  activeView = 'dashboard', 
  onSelectView, 
  unreadAlertCount = 0,
  theme = 'light',
  onToggleTheme,
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

      {/* Right Circular Actions */}
      <div className="topbar-actions">
        {/* Night / Light Mode Toggle */}
        <button 
          className="circle-action-btn theme-toggle-btn"
          aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Night Mode'}
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Night Mode'}
        >
          {theme === 'dark' ? (
            <Sun size={16} style={{ color: '#F59E0B' }} />
          ) : (
            <Moon size={16} style={{ color: 'var(--text-secondary)' }} />
          )}
        </button>

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
          title="Alex (Click for Settings)"
          onClick={() => onSelectView?.('settings')}
        >
          AB
        </div>
      </div>
    </header>
  );
}
