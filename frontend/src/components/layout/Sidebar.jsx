import React from 'react';
import { 
  LayoutGrid, 
  BarChart2, 
  Wallet, 
  CreditCard, 
  Sliders, 
  Bell, 
  Percent, 
  Settings, 
  LogOut 
} from 'lucide-react';

export function Sidebar({ activeNav = 'dashboard', onSelectNav }) {
  return (
    <aside className="slim-dock">
      {/* Top Active Green Squircle */}
      <button 
        className="dock-active-box" 
        onClick={() => onSelectNav?.('dashboard')}
        aria-label="Dashboard"
      >
        <LayoutGrid size={20} />
      </button>

      {/* Middle Icon List */}
      <button 
        className={`dock-icon-btn ${activeNav === 'analytics' ? 'selected' : ''}`}
        onClick={() => onSelectNav?.('analytics')}
        aria-label="Analytics"
      >
        <BarChart2 size={19} />
      </button>

      <button 
        className={`dock-icon-btn ${activeNav === 'wallet' ? 'selected' : ''}`}
        onClick={() => onSelectNav?.('wallet')}
        aria-label="Payments & Wallet"
      >
        <Wallet size={19} />
      </button>

      <button 
        className={`dock-icon-btn ${activeNav === 'transactions' ? 'selected' : ''}`}
        onClick={() => onSelectNav?.('transactions')}
        aria-label="Transactions"
      >
        <CreditCard size={19} />
      </button>

      <button 
        className={`dock-icon-btn ${activeNav === 'policy' ? 'selected' : ''}`}
        onClick={() => onSelectNav?.('policy')}
        aria-label="Policy Controls"
      >
        <Sliders size={19} />
      </button>

      <button 
        className={`dock-icon-btn ${activeNav === 'alerts' ? 'selected' : ''}`}
        onClick={() => onSelectNav?.('alerts')}
        aria-label="Alerts"
      >
        <Bell size={19} />
      </button>

      <button 
        className={`dock-icon-btn ${activeNav === 'rates' ? 'selected' : ''}`}
        onClick={() => onSelectNav?.('rates')}
        aria-label="Rates"
      >
        <Percent size={19} />
      </button>

      <div className="dock-divider" />

      {/* Bottom Actions */}
      <button 
        className="dock-icon-btn"
        onClick={() => onSelectNav?.('settings')}
        aria-label="Settings"
      >
        <Settings size={19} />
      </button>

      <button 
        className="dock-icon-btn"
        onClick={() => onSelectNav?.('logout')}
        aria-label="Log Out"
      >
        <LogOut size={19} />
      </button>
    </aside>
  );
}
