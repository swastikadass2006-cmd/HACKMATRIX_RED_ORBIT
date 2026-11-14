import React from 'react';
import { Search, Bell, Activity } from 'lucide-react';

export function Topbar({ 
  isConnected = true, 
  lastSyncTime, 
  onSearch, 
  searchValue,
  alertCount = 4 
}) {
  const syncLabel = lastSyncTime 
    ? lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : 'Syncing...';

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search by Transaction ID or UPI (e.g. txn_73921)..."
            value={searchValue || ''}
            onChange={(e) => onSearch?.(e.target.value)}
          />
        </div>
      </div>

      <div className="topbar-right">
        <div className={`status-indicator-pill ${isConnected ? '' : 'disconnected'}`}>
          <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`} />
          <span>{isConnected ? 'Connected • SSE live feed' : 'Offline • Attempting reconnect'}</span>
        </div>

        <span className="sync-time-label tabular-nums">
          <Activity size={14} style={{ color: 'var(--text-muted)' }} />
          <span>Last sync: {syncLabel}</span>
        </span>

        <button className="icon-btn" aria-label="Notifications">
          <Bell size={18} />
          {alertCount > 0 && <span className="notification-badge" />}
        </button>

        <div className="user-avatar-badge" title="Risk Officer: Alex Brown">
          AB
        </div>
      </div>
    </header>
  );
}
