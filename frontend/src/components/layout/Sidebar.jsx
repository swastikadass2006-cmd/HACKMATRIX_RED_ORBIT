import React from 'react';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  ArrowLeftRight, 
  ShieldAlert, 
  Network, 
  PlayCircle, 
  Sliders, 
  FileText, 
  Settings 
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
  { id: 'risk-analytics', label: 'Risk Analytics', icon: ShieldAlert },
  { id: 'fraud-graph', label: 'Fraud Graph', icon: Network },
  { id: 'simulator', label: 'Simulator', icon: PlayCircle },
  { id: 'policy-controls', label: 'Policy Controls', icon: Sliders },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'settings', label: 'Settings', icon: Settings }
];

export function Sidebar({ activeNav = 'overview', onSelectNav, isConnected = true }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="brand-icon-box">
          <ShieldCheck size={22} strokeWidth={2.5} />
        </div>
        <div className="brand-text-container">
          <span className="brand-title">ShieldPay</span>
          <span className="brand-tagline">Secure. Smart. Inclusive.</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeNav === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onSelectNav?.(item.id)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="system-status-chip">
          <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`} />
          <span>{isConnected ? 'Backend: Operational' : 'Backend: Disconnected'}</span>
        </div>
      </div>
    </aside>
  );
}
