import React, { useState } from 'react';
import { ArrowLeft, Server, Activity, ShieldCheck, Check } from 'lucide-react';
import { checkHealth } from '../../api/client';

  const currentApiBase = import.meta.env.VITE_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8000');

  const handleTestBackend = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await checkHealth();
      setTestResult({ ok: true, msg: `FastAPI Operational: ${res.service} v${res.version}` });
    } catch (e) {
      setTestResult({ ok: false, msg: e.message || 'Cannot reach backend server' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
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
              System Integration & Gateway Settings
            </h2>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="quixotic-card">
          <div className="card-header-quixotic">
            <div className="card-title-block">
              <span className="card-main-title" style={{ gap: '6px' }}>
                <Server size={16} style={{ color: 'var(--accent-primary)' }} />
                Backend Service Endpoints
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
            <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: 'var(--bg-secondary)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>API BASE URL</div>
              <div style={{ fontSize: '13px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                {currentApiBase}
              </div>
            </div>

            <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: 'var(--bg-secondary)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>SSE LIVE FEED URL</div>
              <div style={{ fontSize: '13px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent-primary)', wordBreak: 'break-all' }}>
                {currentApiBase}/api/stream
              </div>
            </div>

            <button
              className="btn-pill-solid-dark"
              onClick={handleTestBackend}
              disabled={testing}
              style={{ marginTop: '8px' }}
            >
              {testing ? 'Testing Health...' : 'Ping FastAPI Backend'}
            </button>

            {testResult && (
              <div 
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: testResult.ok ? 'var(--color-success)' : 'var(--color-danger)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Check size={14} />
                <span>{testResult.msg}</span>
              </div>
            )}
          </div>
        </div>

        <div className="quixotic-card">
          <div className="card-header-quixotic">
            <div className="card-title-block">
              <span className="card-main-title" style={{ gap: '6px' }}>
                <ShieldCheck size={16} style={{ color: 'var(--accent-primary)' }} />
                Indian Banking & NPCI Connectors
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: '12px', backgroundColor: 'var(--bg-secondary)' }}>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>UPI 2.0 Real-time Gateway</span>
              <span className="mint-badge-pill">Connected</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: '12px', backgroundColor: 'var(--bg-secondary)' }}>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>NPCI Risk Scoring Webhook</span>
              <span className="mint-badge-pill">Active • 128ms</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: '12px', backgroundColor: 'var(--bg-secondary)' }}>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>IMPS Switch Fallback</span>
              <span className="mint-badge-pill">Standby</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
