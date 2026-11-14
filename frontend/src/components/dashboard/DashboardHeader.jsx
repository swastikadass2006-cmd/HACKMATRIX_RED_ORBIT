import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, Plus, Check } from 'lucide-react';

export function DashboardHeader({ 
  dateRange, 
  onDateRangeChange, 
  onAddAction,
  userName = "Sujon"
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentRange, setCurrentRange] = useState(
    dateRange?.label || '29 Jun, 2025 - 29 August, 2025'
  );
  const [customStart, setCustomStart] = useState('2025-06-29');
  const [customEnd, setCustomEnd] = useState('2025-08-29');
  const dropdownRef = useRef(null);

  // Keep display synchronized with external date changes
  useEffect(() => {
    if (dateRange?.label) {
      setCurrentRange(dateRange.label);
    }
  }, [dateRange?.label]);

  const presets = [
    { id: 'quarter', label: '29 Jun, 2025 - 29 August, 2025', desc: 'Summer Cycle (Default)' },
    { id: 'today', label: 'Today (14 Nov, 2026)', desc: 'Live intraday' },
    { id: '7d', label: 'Last 7 Days (07 Nov - 14 Nov, 2026)', desc: 'Past 168 hours' },
    { id: '30d', label: 'Last 30 Days (15 Oct - 14 Nov, 2026)', desc: 'Monthly window' },
    { id: 'ytd', label: 'Year to Date (2026)', desc: 'Fiscal year cycle' },
  ];

  // Close dropdown on outside click or Escape
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') setIsOpen(false);
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelectPreset = (preset) => {
    setCurrentRange(preset.label);
    onDateRangeChange?.({
      id: preset.id,
      label: preset.label
    });
    setIsOpen(false);
  };

  const handleApplyCustom = (e) => {
    e.preventDefault();
    if (!customStart || !customEnd) return;
    const formatStr = `${customStart} - ${customEnd}`;
    setCurrentRange(formatStr);
    onDateRangeChange?.({
      id: 'custom',
      label: formatStr,
      startDate: customStart,
      endDate: customEnd
    });
    setIsOpen(false);
  };

  return (
    <div className="header-row">
      <div className="header-greeting-title">
        Welcome Back, <span className="header-greeting-name">{userName}</span>
      </div>

      <div className="header-controls">
        {/* Interactive Date Range Dropdown */}
        <div className="date-picker-container" ref={dropdownRef}>
          <button 
            type="button"
            className={`pill-dropdown-btn ${isOpen ? 'active-dropdown' : ''}`}
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            aria-haspopup="true"
          >
            <Calendar size={15} style={{ color: isOpen ? 'var(--accent-primary)' : 'var(--text-secondary)' }} />
            <span style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentRange}
            </span>
            <ChevronDown 
              size={14} 
              style={{ 
                color: 'var(--text-secondary)', 
                transform: isOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s ease'
              }} 
            />
          </button>

          {/* Floating Dropdown Popover */}
          {isOpen && (
            <div className="date-picker-popover" role="dialog" aria-label="Select date range">
              <div className="date-popover-header">
                <span className="date-popover-title">Select Timeframe</span>
                <span className="date-popover-tag">Active</span>
              </div>

              <div className="date-preset-list">
                {presets.map((preset) => {
                  const isSelected = currentRange === preset.label;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      className={`date-preset-item ${isSelected ? 'active' : ''}`}
                      onClick={() => handleSelectPreset(preset)}
                    >
                      <div className="date-preset-info">
                        <span className="date-preset-label">{preset.label}</span>
                        <span className="date-preset-desc">{preset.desc}</span>
                      </div>
                      {isSelected && <Check size={14} className="date-preset-check" />}
                    </button>
                  );
                })}
              </div>

              {/* Custom Date Range Picker */}
              <div className="date-custom-fields">
                <span className="date-custom-heading">Custom Date Range</span>
                <form onSubmit={handleApplyCustom} className="date-custom-form">
                  <div className="date-input-group">
                    <label>From</label>
                    <input 
                      type="date" 
                      value={customStart} 
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="date-input"
                    />
                  </div>
                  <div className="date-input-group">
                    <label>To</label>
                    <input 
                      type="date" 
                      value={customEnd} 
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="date-input"
                    />
                  </div>
                  <button type="submit" className="date-apply-btn">
                    Apply
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Add New Wallet Action */}
        <button className="pill-action-btn" onClick={onAddAction}>
          <Plus size={15} />
          <span>Add New Wallet</span>
        </button>
      </div>
    </div>
  );
}
