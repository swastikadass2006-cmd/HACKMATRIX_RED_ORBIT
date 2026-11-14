import React from 'react';
import { Search, Bell, Shield } from 'lucide-react';

export function Topbar({ 
  activeView = 'dashboard', 
  onSelectView, 
  unreadAlertCount = 2,
  searchQuery,
  onSearchChange
}) {
  const NAV_ITEMS = [
    { id: 'dashboard', label: 'Dashboard' },
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
          title="Alex Brown (Click for Settings)"
          onClick={() => onSelectView?.('settings')}
        >
          AB
        </div>
      </div>
    </header>
  );
}
