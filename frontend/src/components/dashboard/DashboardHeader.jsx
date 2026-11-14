import React from 'react';
import { Calendar, ChevronDown, Plus } from 'lucide-react';

export function DashboardHeader({ onAddAction }) {
  return (
    <div className="header-row">
      <div className="header-greeting-title">
        Welcome Back, <span className="header-greeting-name">Alex</span>
      </div>

      <div className="header-controls">
        <button className="pill-dropdown-btn">
          <Calendar size={15} style={{ color: 'var(--text-secondary)' }} />
          <span>29 Jun, 2025 - 29 August, 2025</span>
          <ChevronDown size={14} style={{ color: 'var(--text-secondary)' }} />
        </button>

        <button className="pill-action-btn" onClick={onAddAction}>
          <Plus size={15} />
          <span>Add New Wallet</span>
        </button>
      </div>
    </div>
  );
}
