import React, { useState, useEffect } from 'react';
import { ArrowLeft, Sliders, Shield, Check, AlertCircle } from 'lucide-react';
import { fetchPolicy, updatePolicy } from '../../api/client';

export function PolicyView({ onBackToDashboard }) {
  const [blockThreshold, setBlockThreshold] = useState(75);
  const [stepUpThreshold, setStepUpThreshold] = useState(40);
  const [coercionGuard, setCoercionGuard] = useState(true);
  const [muleHopGuard, setMuleHopGuard] = useState(true);
  const [simSwapGuard, setSimSwapGuard] = useState(true);
  const [statusMsg, setStatusMsg] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPolicy().then((p) => {
      if (p) {
        if (p.block_threshold !== undefined) setBlockThreshold(p.block_threshold);
        if (p.step_up_threshold !== undefined) setStepUpThreshold(p.step_up_threshold);
      }
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    if (stepUpThreshold > blockThreshold) {
      setStatusMsg({ type: 'error', text: 'Step-up threshold cannot exceed Block threshold' });
      return;
    }
    setSaving(true);
    setStatusMsg(null);
    try {
      await updatePolicy({
        block_threshold: parseInt(blockThreshold, 10),
        step_up_threshold: parseInt(stepUpThreshold, 10)
      });
      setStatusMsg({ type: 'success', text: 'UPI Risk Policy thresholds updated successfully!' });
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to save policy' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
      {/* Top Header */}
      <div className="quixotic-card" style={{ padding: '16px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              className="pill-action-btn"
              onClick={onBackToDashboard}
              style={{ padding: '6px 14px', fontSize: '12px' }}
            >
              <ArrowLeft size={14} />
              <span>Back to Dashboard</span>
            </button>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Fraud Policies & Risk Thresholds
            </h2>
          </div>

          <button 
            className="btn-pill-solid-dark"
            onClick={handleSave}
            disabled={saving}
            style={{ padding: '8px 20px', fontSize: '12.5px' }}
          >
            {saving ? 'Applying...' : 'Apply Changes'}
          </button>
        </div>
      </div>

      {statusMsg && (
        <div 
          style={{
            padding: '12px 18px',
            borderRadius: '14px',
            backgroundColor: statusMsg.type === 'success' ? 'var(--accent-mint-light)' : 'var(--color-danger-bg)',
            color: statusMsg.type === 'success' ? 'var(--accent-primary)' : 'var(--color-danger)',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {statusMsg.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Main Form */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Sliders Card */}
        <div className="quixotic-card">
          <div className="card-header-quixotic">
            <div className="card-title-block">
              <span className="card-main-title" style={{ gap: '6px' }}>
                <Sliders size={16} style={{ color: 'var(--accent-primary)' }} />
                Scoring Cut-off Thresholds
              </span>
              <span className="card-sub-title">Numerical score boundaries (0 - 100)</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '10px' }}>
            {/* Block Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, marginBottom: '8px' }}>
                <span>Block Threshold (High Risk)</span>
                <span className="mint-badge-pill tabular-nums" style={{ color: 'var(--color-danger)', backgroundColor: 'var(--color-danger-bg)' }}>
                  {blockThreshold}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                value={blockThreshold}
                onChange={(e) => setBlockThreshold(parseInt(e.target.value, 10))}
                className="mini-slider-input"
                style={{ height: '7px' }}
              />
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                Transactions scoring {blockThreshold} or above are immediately halted at the switch.
              </p>
            </div>

            {/* Step-up Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, marginBottom: '8px' }}>
                <span>Step-up Threshold (Medium Risk)</span>
                <span className="mint-badge-pill tabular-nums" style={{ color: 'var(--color-warning)', backgroundColor: 'var(--color-warning-bg)' }}>
                  {stepUpThreshold}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                value={stepUpThreshold}
                onChange={(e) => setStepUpThreshold(parseInt(e.target.value, 10))}
                className="mini-slider-input"
                style={{ height: '7px' }}
              />
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                Transactions between {stepUpThreshold} and {blockThreshold - 1} require secondary biometric or SMS OTP confirmation.
              </p>
            </div>
          </div>
        </div>

        {/* Dynamic Guardrail Rules */}
        <div className="quixotic-card">
          <div className="card-header-quixotic">
            <div className="card-title-block">
              <span className="card-main-title" style={{ gap: '6px' }}>
                <Shield size={16} style={{ color: 'var(--accent-primary)' }} />
                Specialized Fraud Heuristics
              </span>
              <span className="card-sub-title">Automated AI rule engines</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '12px', backgroundColor: 'var(--bg-secondary)', cursor: 'pointer' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Active GSM Voice Call Intercept</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Flags first-time payees receiving high transfers during ongoing audio calls</div>
              </div>
              <input 
                type="checkbox" 
                checked={coercionGuard} 
                onChange={(e) => setCoercionGuard(e.target.checked)}
                style={{ accentColor: 'var(--accent-primary)', width: 16, height: 16 }}
              />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '12px', backgroundColor: 'var(--bg-secondary)', cursor: 'pointer' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Digital Mule Hub & Hop Filter</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Automated graph trace identifying multi-source inbound funds forwarding</div>
              </div>
              <input 
                type="checkbox" 
                checked={muleHopGuard} 
                onChange={(e) => setMuleHopGuard(e.target.checked)}
                style={{ accentColor: 'var(--accent-primary)', width: 16, height: 16 }}
              />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '12px', backgroundColor: 'var(--bg-secondary)', cursor: 'pointer' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>SIM Swap & Geo-Velocity Anomaly</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Blocks device tokens updated within 2 hours of significant distance jump</div>
              </div>
              <input 
                type="checkbox" 
                checked={simSwapGuard} 
                onChange={(e) => setSimSwapGuard(e.target.checked)}
                style={{ accentColor: 'var(--accent-primary)', width: 16, height: 16 }}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
