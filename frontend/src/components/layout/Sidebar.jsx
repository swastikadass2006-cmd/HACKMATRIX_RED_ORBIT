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
  LogOut,
  Send,
  Cpu,
  Bot
} from 'lucide-react';

export function Sidebar({ activeView = 'dashboard', onSelectView }) {
  const isDashboard = activeView === 'dashboard';

  return (
    <aside className="slim-dock">
      {/* Top Active Green Squircle */}
      <button 
        className={`dock-active-box ${isDashboard ? '' : 'selected'}`}
        style={{
          backgroundColor: isDashboard ? 'var(--accent-primary)' : 'var(--bg-secondary)',
          color: isDashboard ? '#FFFFFF' : 'var(--text-secondary)'
        }}
        onClick={() => onSelectView?.('dashboard')}
        aria-label="Dashboard Overview"
        title="Dashboard"
      >
        <LayoutGrid size={20} />
      </button>

      {/* Middle Icon List */}
      <button 
        className={`dock-icon-btn ${activeView === 'payer' ? 'selected' : ''}`}
        onClick={() => onSelectView?.('payer')}
        aria-label="UPI Payer App"
        title="UPI Payer App (Track 1 Rails)"
      >
        <Send size={19} />
      </button>

      <button 
        className={`dock-icon-btn ${activeView === 'analytics' ? 'selected' : ''}`}
        onClick={() => onSelectView?.('analytics')}
        aria-label="Reports & Analytics"
        title="Reports & Analytics"
      >
        <BarChart2 size={19} />
      </button>

      <button 
        className={`dock-icon-btn ${activeView === 'contacts' ? 'selected' : ''}`}
        onClick={() => onSelectView?.('contacts')}
        aria-label="UPI VPA Directory"
        title="UPI VPA Directory"
      >
        <Wallet size={19} />
      </button>

      <button 
        className={`dock-icon-btn ${activeView === 'transactions' ? 'selected' : ''}`}
        onClick={() => onSelectView?.('transactions')}
        aria-label="Transaction History"
        title="Transaction History"
      >
        <CreditCard size={19} />
      </button>

      <button 
        className={`dock-icon-btn ${activeView === 'policy' ? 'selected' : ''}`}
        onClick={() => onSelectView?.('policy')}
        aria-label="Policy Controls"
        title="Policy Controls"
      >
        <Sliders size={19} />
      </button>

      <button 
        className={`dock-icon-btn ${activeView === 'alerts' ? 'selected' : ''}`}
        onClick={() => onSelectView?.('alerts')}
        aria-label="Security Alerts"
        title="Security Alerts"
      >
        <Bell size={19} />
      </button>

      <button 
        className={`dock-icon-btn ${activeView === 'simulator' ? 'selected' : ''}`}
        onClick={() => onSelectView?.('simulator')}
        aria-label="Attack Simulator"
        title="Attack Simulator Studio"
      >
        <Percent size={19} />
      </button>

      <button 
        className={`dock-icon-btn ${activeView === 'scanner' ? 'selected' : ''}`}
        onClick={() => onSelectView?.('scanner')}
        aria-label="TrustLens ML Scanner"
        title="TrustLens ML Threat Analyzer"
      >
        <Cpu size={19} />
      </button>

      <button 
        className={`dock-icon-btn ${activeView === 'copilot' ? 'selected' : ''}`}
        onClick={() => onSelectView?.('copilot')}
        aria-label="AI Security Copilot"
        title="Gemini AI Security Copilot"
      >
        <Bot size={19} />
      </button>

      <div className="dock-divider" />

      {/* Bottom Actions */}
      <button 
        className={`dock-icon-btn ${activeView === 'settings' ? 'selected' : ''}`}
        onClick={() => onSelectView?.('settings')}
        aria-label="Settings"
        title="System Settings"
      >
        <Settings size={19} />
      </button>

      <button 
        className="dock-icon-btn"
        onClick={() => {
          if (window.confirm('Reset local dashboard session?')) {
            window.location.reload();
          }
        }}
        aria-label="Reset / Log Out"
        title="Reset Session"
      >
        <LogOut size={19} />
      </button>
    </aside>
  );
}
