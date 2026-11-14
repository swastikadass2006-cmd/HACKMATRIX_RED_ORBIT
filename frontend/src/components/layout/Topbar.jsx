import React from 'react';
import { Search, Bell, Shield, ArrowUpRight } from 'lucide-react';

export function Topbar({ activeTab = 'Dashboard', onSelectTab }) {
  const NAV_ITEMS = ['Dashboard', 'Reports', 'Documents', 'History', 'Contacts'];

  return (
    <header className="topbar-quixotic">
      {/* Brand */}
      <div className="topbar-brand">
        <div className="topbar-logo-ring">
          <Shield size={18} strokeWidth={2.6} />
        </div>
        <span className="topbar-brand-name">ShieldPay</span>
      </div>

      {/* Center Nav Pills */}
      <nav className="topbar-nav-pill-group">
        {NAV_ITEMS.map((item) => (
          <button
            key={item}
            className={`topbar-nav-item ${activeTab === item ? 'active' : ''}`}
            onClick={() => onSelectTab?.(item)}
          >
            {item}
          </button>
        ))}
      </nav>

      {/* Right Circular Actions */}
      <div className="topbar-actions">
        <button className="circle-action-btn" aria-label="Search">
          <Search size={16} />
        </button>

        <button className="circle-action-btn" aria-label="Notifications">
          <Bell size={16} />
          <span className="unread-dot" />
        </button>

        <div className="user-avatar-circle" title="Alex Brown">
          AB
        </div>
      </div>
    </header>
  );
}
