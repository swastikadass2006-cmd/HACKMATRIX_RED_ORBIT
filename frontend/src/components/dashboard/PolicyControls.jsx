import React, { useState, useEffect } from 'react';
import { Sliders, Check, AlertCircle } from 'lucide-react';
import { updatePolicy } from '../../api/client';

export function PolicyControls({ initialPolicy, onPolicySaved }) {
  const [blockThreshold, setBlockThreshold] = useState(75);
  const [stepUpThreshold, setStepUpThreshold] = useState(40);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    if (initialPolicy) {
      if (initialPolicy.block_threshold !== undefined) setBlockThreshold(initialPolicy.block_threshold);
      if (initialPolicy.step_up_threshold !== undefined) setStepUpThreshold(initialPolicy.step_up_threshold);
    }
  }, [initialPolicy]);

  const handleApply = async () => {
    if (stepUpThreshold > blockThreshold) {
      setStatusMessage({ type: 'error', text: 'Step-up threshold cannot exceed Block threshold' });
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);
    try {
      const updated = await updatePolicy({
        block_threshold: parseInt(blockThreshold, 10),
        step_up_threshold: parseInt(stepUpThreshold, 10)
      });
      setStatusMessage({ type: 'success', text: 'Policy thresholds applied successfully!' });
      onPolicySaved?.(updated);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to update policy' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="card-container policy-card">
      <div className="card-header-row" style={{ marginBottom: 12 }}>
        <div className="card-title-group">
          <Sliders size={18} className="card-title-icon" />
          <h2 className="card-title">Policy controls</h2>
        </div>
      </div>

      <div className="slider-group">
        <div className="slider-label-row">
          <span>Block threshold</span>
          <span className="slider-value-pill tabular-nums">{blockThreshold}</span>
        </div>
        <input
          type="range"
          min="1"
          max="100"
          value={blockThreshold}
          onChange={(e) => setBlockThreshold(parseInt(e.target.value, 10))}
          className="custom-range-slider"
        />
      </div>

      <div className="slider-group">
        <div className="slider-label-row">
          <span>Step-up threshold</span>
          <span className="slider-value-pill tabular-nums">{stepUpThreshold}</span>
        </div>
        <input
          type="range"
          min="1"
          max="100"
          value={stepUpThreshold}
          onChange={(e) => setStepUpThreshold(parseInt(e.target.value, 10))}
          className="custom-range-slider"
        />
      </div>

      {statusMessage && (
        <div
          style={{
            fontSize: '12px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: statusMessage.type === 'success' ? '#108053' : '#E84658'
          }}
        >
          {statusMessage.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <button
        className="btn-primary"
        onClick={handleApply}
        disabled={isSaving}
      >
        {isSaving ? 'Applying...' : 'Apply changes'}
      </button>
    </div>
  );
}
