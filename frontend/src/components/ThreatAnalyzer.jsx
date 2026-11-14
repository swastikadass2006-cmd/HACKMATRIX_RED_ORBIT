import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Search, 
  Zap, 
  Cpu, 
  Code, 
  RefreshCw, 
  Bot, 
  AlertTriangle, 
  ArrowLeft,
  MessageSquare,
  Globe,
  Clock,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Lock,
  Copy,
  Check,
  X
} from 'lucide-react';
import { analyzeThreat, analyzeThreatMessage, fetchRecentScans, commitThreatReport } from '../api/client';

export function ThreatAnalyzer({ onBackToDashboard, onConsultCopilot, initialUrl = '' }) {
  // Main view mode: 'url' or 'message'
  const [activeScannerMode, setActiveScannerMode] = useState('url');

  // URL Scanner state (starts completely empty)
  const [url, setUrl] = useState(initialUrl || '');
  const [html, setHtml] = useState('');
  const [showHtmlInput, setShowHtmlInput] = useState(false);
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlResult, setUrlResult] = useState(null);
  const [urlError, setUrlError] = useState(null);
  const [urlActiveTab, setUrlActiveTab] = useState('shap'); // 'shap' | 'features' | 'html'

  // Message Scanner state (starts completely empty)
  const [message, setMessage] = useState('');
  const [msgLoading, setMsgLoading] = useState(false);
  const [msgResult, setMsgResult] = useState(null);
  const [msgError, setMsgError] = useState(null);

  // Live Recent Scans (dynamically fetched from GET /api/threat/recent)
  const [recentScans, setRecentScans] = useState([]);
  const [loadingScans, setLoadingScans] = useState(false);

  // Web3 Threat Report Anchoring state
  const [web3UrlCommitment, setWeb3UrlCommitment] = useState(null);
  const [web3UrlLoading, setWeb3UrlLoading] = useState(false);
  const [web3MsgCommitment, setWeb3MsgCommitment] = useState(null);
  const [web3MsgLoading, setWeb3MsgLoading] = useState(false);
  const [copiedHash, setCopiedHash] = useState(null);

  const copyToClipboard = (text, key) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setCopiedHash(key);
      setTimeout(() => setCopiedHash(null), 2500);
    }
  };

  const handleCommitUrlToWeb3 = async () => {
    if (!urlResult) return;
    setWeb3UrlLoading(true);
    try {
      const res = await commitThreatReport({
        report: urlResult,
        report_type: 'UrlScan'
      });
      setWeb3UrlCommitment(res);
    } catch (err) {
      console.error('Web3 commit error:', err);
    } finally {
      setWeb3UrlLoading(false);
    }
  };

  const handleCommitMsgToWeb3 = async () => {
    if (!msgResult) return;
    setWeb3MsgLoading(true);
    try {
      const res = await commitThreatReport({
        report: msgResult,
        report_type: 'ScamMessage'
      });
      setWeb3MsgCommitment(res);
    } catch (err) {
      console.error('Web3 commit error:', err);
    } finally {
      setWeb3MsgLoading(false);
    }
  };

  // Refresh recent scans from live API
  const refreshRecentScans = async () => {
    try {
      setLoadingScans(true);
      const data = await fetchRecentScans();
      if (data?.scans) {
        setRecentScans(data.scans);
      }
    } catch (err) {
      console.warn('Could not load recent scans:', err);
    } finally {
      setLoadingScans(false);
    }
  };

  useEffect(() => {
    refreshRecentScans();
  }, []);

  // Analyze URL handler
  const handleAnalyzeUrl = async (overrideUrl, overrideHtml) => {
    const targetUrl = overrideUrl !== undefined ? overrideUrl : url;
    const targetHtml = overrideHtml !== undefined ? overrideHtml : html;

    if (!targetUrl.trim() && !targetHtml.trim()) {
      setUrlError('Please enter a target URL, FQDN, or IP to analyze.');
      return;
    }

    setUrlLoading(true);
    setUrlError(null);
    setWeb3UrlCommitment(null);

    try {
      const data = await analyzeThreat({
        url: targetUrl.trim() || undefined,
        html: targetHtml ? targetHtml.trim() : undefined,
        include_shap: true,
        top_shap_count: 6
      });
      setUrlResult(data);
      refreshRecentScans();
    } catch (err) {
      setUrlError(err.message || 'Threat analysis request failed.');
    } finally {
      setUrlLoading(false);
    }
  };

  // Analyze Message handler
  const handleAnalyzeMessage = async () => {
    if (!message.trim()) {
      setMsgError('Please enter or paste a message to analyze.');
      return;
    }

    setMsgLoading(true);
    setMsgError(null);
    setWeb3MsgCommitment(null);

    try {
      const data = await analyzeThreatMessage({
        message: message.trim()
      });
      setMsgResult(data);
      refreshRecentScans();
    } catch (err) {
      setMsgError(err.message || 'Scam message analysis failed.');
    } finally {
      setMsgLoading(false);
    }
  };

  // Load a scan from history
  const handleSelectRecentScan = (scan) => {
    setWeb3UrlCommitment(null);
    setWeb3MsgCommitment(null);
    if (scan.scan_type === 'url') {
      setActiveScannerMode('url');
      setUrl(scan.target);
      handleAnalyzeUrl(scan.target, '');
    } else {
      setActiveScannerMode('message');
      setMessage(scan.target);
      handleAnalyzeMessage();
    }
  };

  const renderWeb3ProofCard = (commitment) => {
    if (!commitment) return null;
    return (
      <div style={{
        marginTop: '16px',
        padding: '16px',
        borderRadius: '12px',
        backgroundColor: '#0F172A',
        color: '#F8FAFC',
        border: '1px solid #1E293B',
        boxShadow: '0 4px 14px rgba(0,0,0,0.18)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38BDF8'
            }}>
              <Lock size={16} />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>TrustLens Web3 Registry Anchor</span>
                <span style={{
                  fontSize: '9px',
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: '#064E3B',
                  color: '#34D399',
                  textTransform: 'uppercase'
                }}>
                  Sepolia Verified
                </span>
              </div>
              <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                Cryptographic RFC 8785 Canonical JSON + Keccak-256 Digest
              </span>
            </div>
          </div>
          <a
            href={commitment.explorer_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              color: '#38BDF8',
              textDecoration: 'none',
              fontWeight: 600
            }}
          >
            <span>View on Etherscan</span>
            <ExternalLink size={12} />
          </a>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', fontSize: '11px' }}>
          {/* Report Hash */}
          <div style={{ 
            backgroundColor: 'rgba(30, 41, 59, 0.75)', 
            padding: '8px 10px', 
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.06)'
          }}>
            <div style={{ color: '#94A3B8', fontSize: '10px', fontWeight: 600, marginBottom: '3px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>REPORT HASH (KECCAK-256)</span>
              <button
                type="button"
                onClick={() => copyToClipboard(commitment.report_hash, 'hash')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: copiedHash === 'hash' ? '#34D399' : '#38BDF8',
                  fontSize: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  padding: 0
                }}
              >
                {copiedHash === 'hash' ? <Check size={11} /> : <Copy size={11} />}
                <span>{copiedHash === 'hash' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div style={{ fontFamily: 'monospace', color: '#E2E8F0', wordBreak: 'break-all', fontSize: '11px' }}>
              {commitment.report_hash}
            </div>
          </div>

          {/* Details Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div style={{ 
              backgroundColor: 'rgba(30, 41, 59, 0.75)', 
              padding: '6px 10px', 
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.06)'
            }}>
              <div style={{ color: '#94A3B8', fontSize: '10px', fontWeight: 600 }}>REGISTRY CONTRACT</div>
              <div style={{ fontFamily: 'monospace', color: '#CBD5E1', fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {commitment.contract_address}
              </div>
            </div>

            <div style={{ 
              backgroundColor: 'rgba(30, 41, 59, 0.75)', 
              padding: '6px 10px', 
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.06)'
            }}>
              <div style={{ color: '#94A3B8', fontSize: '10px', fontWeight: 600 }}>BLOCK & TIME</div>
              <div style={{ color: '#CBD5E1', fontSize: '11px' }}>
                Block #{commitment.block_number} • {new Date(commitment.timestamp * 1000).toLocaleTimeString()}
              </div>
            </div>
          </div>

          {/* Status Row */}
          <div style={{ 
            backgroundColor: 'rgba(30, 41, 59, 0.75)', 
            padding: '6px 10px', 
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '6px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#34D399', display: 'inline-block' }} />
              <span style={{ color: '#34D399', fontWeight: 700, fontSize: '11px' }}>
                {commitment.status}
              </span>
            </div>
            <span style={{ color: '#94A3B8', fontSize: '10px' }}>
              Tx: <span style={{ fontFamily: 'monospace' }}>{commitment.transaction_hash.slice(0, 10)}...{commitment.transaction_hash.slice(-6)}</span>
            </span>
          </div>
        </div>
      </div>
    );
  };

  const isUrlMalicious = urlResult?.verdict === 'MALICIOUS';
  const urlScore = urlResult?.risk_score ?? 0;
  const urlConfidence = urlResult?.confidence_percent ?? 0;
  const brandAlert = urlResult?.brand_detection || urlResult?.brand_alert;
  const shapFactors = urlResult?.top_shap_factors || urlResult?.shap_explanations || [];

  const isMsgMalicious = msgResult?.verdict === 'MALICIOUS';
  const isMsgSuspicious = msgResult?.verdict === 'SUSPICIOUS';
  const msgScore = msgResult?.risk_score ?? 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
      {/* Top Header Card */}
      <div className="quixotic-card" style={{ padding: '16px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {onBackToDashboard && (
              <button 
                className="pill-action-btn"
                onClick={onBackToDashboard}
                style={{ padding: '6px 14px', fontSize: '12px' }}
              >
                <ArrowLeft size={14} />
                <span>Dashboard</span>
              </button>
            )}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Cpu size={20} style={{ color: 'var(--accent-primary)' }} />
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  TrustLens™ ML Threat & Scam Analyzer
                </h2>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                Real-time Dual Engine: 26-Feature XGBoost URL Classifier + Multi-Class Scam & Phishing Message Detector
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div style={{ display: 'flex', backgroundColor: '#E2E8F0', padding: '3px', borderRadius: '10px' }}>
            <button
              onClick={() => setActiveScannerMode('url')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: activeScannerMode === 'url' ? '#FFFFFF' : 'transparent',
                color: activeScannerMode === 'url' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                fontWeight: activeScannerMode === 'url' ? 700 : 500,
                fontSize: '12px',
                cursor: 'pointer',
                boxShadow: activeScannerMode === 'url' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <Globe size={14} />
              <span>URL Threat Scanner</span>
            </button>

            <button
              onClick={() => setActiveScannerMode('message')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: activeScannerMode === 'message' ? '#FFFFFF' : 'transparent',
                color: activeScannerMode === 'message' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                fontWeight: activeScannerMode === 'message' ? 700 : 500,
                fontSize: '12px',
                cursor: 'pointer',
                boxShadow: activeScannerMode === 'message' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <MessageSquare size={14} />
              <span>Scam Message Analyzer</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: URL THREAT SCANNER */}
      {/* ========================================================================= */}
      {activeScannerMode === 'url' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '20px' }}>
          
          {/* Left Column: URL Input & Live Recent Scans */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div className="quixotic-card" style={{ padding: '22px' }}>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Target URL or UPI Web Redirection
                  </label>
                  <span style={{ fontSize: '11px', color: 'var(--accent-primary)', fontWeight: 600 }}>
                    26-Feature Lexical + XGBoost
                  </span>
                </div>
                <div 
                  style={{ 
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: '12px',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1.5px solid var(--border-light)',
                    transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
                  }}
                >
                  <Search 
                    size={16} 
                    style={{ 
                      position: 'absolute', 
                      left: '14px', 
                      color: 'var(--text-secondary)',
                      pointerEvents: 'none'
                    }} 
                  />
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://suspicious-upi-portal.xyz/login"
                    style={{
                      width: '100%',
                      padding: '13px 40px 13px 42px',
                      borderRadius: '12px',
                      border: 'none',
                      fontSize: '13px',
                      outline: 'none',
                      backgroundColor: 'transparent',
                      color: 'var(--text-primary)',
                      fontFamily: 'Consolas, Monaco, monospace',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => {
                      if (e.currentTarget.parentElement) {
                        e.currentTarget.parentElement.style.borderColor = 'var(--accent-primary)';
                        e.currentTarget.parentElement.style.boxShadow = '0 0 0 3px var(--accent-glow)';
                      }
                    }}
                    onBlur={(e) => {
                      if (e.currentTarget.parentElement) {
                        e.currentTarget.parentElement.style.borderColor = 'var(--border-light)';
                        e.currentTarget.parentElement.style.boxShadow = 'none';
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAnalyzeUrl();
                    }}
                  />
                  {url && (
                    <button
                      type="button"
                      onClick={() => setUrl('')}
                      title="Clear input"
                      style={{
                        position: 'absolute',
                        right: '12px',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Optional HTML Toggle */}
              <div style={{ marginBottom: '16px' }}>
                <button
                  type="button"
                  onClick={() => setShowHtmlInput(!showHtmlInput)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-primary)',
                    fontSize: '12px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  <Code size={14} />
                  <span>{showHtmlInput ? 'Hide DOM HTML Input' : '+ Inspect DOM HTML Snippet (Optional)'}</span>
                </button>

                {showHtmlInput && (
                  <textarea
                    rows={4}
                    value={html}
                    onChange={(e) => setHtml(e.target.value)}
                    placeholder="Paste optional page HTML to evaluate form submits & hidden iframes..."
                    style={{
                      width: '100%',
                      marginTop: '8px',
                      padding: '12px',
                      borderRadius: '10px',
                      border: '1.5px solid var(--border-light)',
                      fontSize: '12px',
                      fontFamily: 'Consolas, Monaco, monospace',
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                )}
              </div>

              {/* Submit Button */}
              <button
                onClick={() => handleAnalyzeUrl()}
                disabled={urlLoading}
                type="button"
                style={{
                  width: '100%',
                  padding: '13px 20px',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-dark) 100%)',
                  color: '#FFFFFF',
                  border: '1px solid var(--accent-primary)',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: urlLoading ? 'not-allowed' : 'pointer',
                  opacity: urlLoading ? 0.75 : 1,
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  if (!urlLoading) {
                    e.currentTarget.style.filter = 'brightness(1.08)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!urlLoading) {
                    e.currentTarget.style.filter = 'none';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                {urlLoading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Extracting 26 Features & Predicting...</span>
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    <span>Analyze Threat with TrustLens ML</span>
                  </>
                )}
              </button>

              {urlError && (
                <div style={{ 
                  marginTop: '12px', 
                  padding: '10px 14px', 
                  borderRadius: '8px', 
                  backgroundColor: 'var(--color-danger-bg)', 
                  color: 'var(--color-danger)', 
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertTriangle size={15} />
                  <span>{urlError}</span>
                </div>
              )}
            </div>

            {/* Recent Asset Scans (Live from Backend) */}
            <div className="quixotic-card" style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Recent Asset Scans
                </span>
                <button
                  onClick={refreshRecentScans}
                  title="Refresh Scans"
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '2px' }}
                >
                  <RefreshCw size={13} className={loadingScans ? 'animate-spin' : ''} />
                </button>
              </div>

              {recentScans.length === 0 ? (
                <div style={{ 
                  padding: '24px 16px', 
                  textAlign: 'center', 
                  backgroundColor: '#F8FAF9', 
                  borderRadius: '10px',
                  border: '1px dashed var(--border-light)',
                  color: 'var(--text-secondary)',
                  fontSize: '12px'
                }}>
                  <Clock size={20} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                  <p style={{ margin: 0, fontWeight: 600 }}>No scans recorded yet.</p>
                  <p style={{ margin: '4px 0 0', fontSize: '11px' }}>Submit a URL above to run live ML inference.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '260px', overflowY: 'auto' }}>
                  {recentScans.map((s) => {
                    const isScanMalicious = s.verdict === 'MALICIOUS';
                    const isScanSuspicious = s.verdict === 'SUSPICIOUS';
                    const badgeBg = isScanMalicious ? '#FEE2E2' : isScanSuspicious ? '#FEF3C7' : '#DCFCE7';
                    const badgeColor = isScanMalicious ? '#DC2626' : isScanSuspicious ? '#B45309' : '#15803D';

                    return (
                      <button
                        key={s.id}
                        onClick={() => handleSelectRecentScan(s)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-light)',
                          backgroundColor: '#FFFFFF',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <div style={{ overflow: 'hidden', paddingRight: '8px' }}>
                          <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {s.target}
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                            Score: <strong>{s.risk_score}/100</strong> • {s.latency_ms}ms
                          </div>
                        </div>
                        <span style={{
                          fontSize: '9px',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: badgeBg,
                          color: badgeColor,
                          flexShrink: 0
                        }}>
                          {s.verdict}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Live URL Model Output & SHAP */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="quixotic-card" style={{ padding: '22px' }}>
              {urlLoading ? (
                <div style={{ textAlign: 'center', padding: '50px 20px' }}>
                  <RefreshCw size={36} className="animate-spin" style={{ color: 'var(--accent-primary)', margin: '0 auto 12px' }} />
                  <p style={{ fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                    Extracting 26 features & calculating SHAP attributions...
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Evaluating Shannon entropy, punycode tokens & brand vector similarity
                  </p>
                </div>
              ) : urlResult ? (
                <div>
                  {/* Top Verdict Strip */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    paddingBottom: '16px',
                    borderBottom: '1px solid var(--border-light)',
                    marginBottom: '16px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {isUrlMalicious ? (
                        <div style={{ 
                          width: '44px', 
                          height: '44px', 
                          borderRadius: '12px', 
                          backgroundColor: '#FEE2E2', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          color: '#DC2626'
                        }}>
                          <ShieldAlert size={26} />
                        </div>
                      ) : (
                        <div style={{ 
                          width: '44px', 
                          height: '44px', 
                          borderRadius: '12px', 
                          backgroundColor: '#DCFCE7', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          color: '#16A34A'
                        }}>
                          <ShieldCheck size={26} />
                        </div>
                      )}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ 
                            fontSize: '16px', 
                            fontWeight: 800, 
                            color: isUrlMalicious ? '#DC2626' : '#16A34A'
                          }}>
                            {urlResult.verdict}
                          </span>
                          <span style={{ 
                            fontSize: '11px', 
                            fontWeight: 700, 
                            padding: '2px 8px', 
                            borderRadius: '12px',
                            backgroundColor: isUrlMalicious ? '#FEE2E2' : '#DCFCE7',
                            color: isUrlMalicious ? '#DC2626' : '#16A34A'
                          }}>
                            Confidence: {urlConfidence.toFixed(1)}%
                          </span>
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          Inference Latency: <strong>{urlResult.latency_ms ?? 1.2}ms</strong>
                        </span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '28px', fontWeight: 900, color: isUrlMalicious ? '#DC2626' : '#16A34A', lineHeight: 1 }}>
                        {urlScore}
                        <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500 }}>/100</span>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                        TrustLens Risk
                      </span>
                    </div>
                  </div>

                  {/* Brand Impersonation Alert */}
                  {brandAlert?.is_impersonating && (
                    <div style={{ 
                      padding: '12px 14px', 
                      borderRadius: '10px', 
                      backgroundColor: '#FEF3C7', 
                      border: '1.5px solid #F59E0B',
                      marginBottom: '16px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#B45309', fontWeight: 700, fontSize: '13px' }}>
                        <AlertTriangle size={16} />
                        <span>Brand Impersonation Detected!</span>
                      </div>
                      <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#92400E' }}>
                        Mimics <strong>{brandAlert.target_brand}</strong> (Official: <code>{brandAlert.official_domain}</code>) with string similarity of <strong>{((brandAlert.similarity || 0) * 100).toFixed(0)}%</strong>.
                      </p>
                    </div>
                  )}

                  {/* Tab Navigation */}
                  <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-light)', marginBottom: '14px' }}>
                    <button
                      onClick={() => setUrlActiveTab('shap')}
                      style={{
                        padding: '8px 14px',
                        background: 'none',
                        border: 'none',
                        borderBottom: urlActiveTab === 'shap' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                        fontWeight: urlActiveTab === 'shap' ? 700 : 500,
                        color: urlActiveTab === 'shap' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        fontSize: '13px'
                      }}
                    >
                      SHAP Factor Contributions
                    </button>
                    <button
                      onClick={() => setUrlActiveTab('features')}
                      style={{
                        padding: '8px 14px',
                        background: 'none',
                        border: 'none',
                        borderBottom: urlActiveTab === 'features' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                        fontWeight: urlActiveTab === 'features' ? 700 : 500,
                        color: urlActiveTab === 'features' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        fontSize: '13px'
                      }}
                    >
                      URL Features (26)
                    </button>
                  </div>

                  {/* SHAP Bars */}
                  {urlActiveTab === 'shap' && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          Feature Contribution Weights
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          Red = Risk Push (+) | Green = Safe Push (-)
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {shapFactors.map((f, idx) => {
                          const isRiskPush = f.impact === 'increases_risk';
                          const absVal = Math.abs(f.shap_value);
                          const barWidth = Math.min(100, Math.max(15, absVal * 90));

                          return (
                            <div 
                              key={idx}
                              style={{ 
                                padding: '8px 10px', 
                                borderRadius: '8px', 
                                backgroundColor: '#F8FAF9',
                                border: '1px solid var(--border-light)'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                                <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                                  {f.feature} <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>= {f.feature_value}</span>
                                </span>
                                <span style={{ 
                                  fontWeight: 700, 
                                  color: isRiskPush ? '#DC2626' : '#16A34A',
                                  fontFamily: 'monospace'
                                }}>
                                  {isRiskPush ? `+${f.shap_value.toFixed(3)}` : `${f.shap_value.toFixed(3)}`}
                                </span>
                              </div>

                              <div style={{ height: '6px', width: '100%', backgroundColor: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                                <div 
                                  style={{ 
                                    height: '100%', 
                                    width: `${barWidth}%`, 
                                    backgroundColor: isRiskPush ? '#EF4444' : '#10B981',
                                    borderRadius: '3px'
                                  }} 
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Feature Table */}
                  {urlActiveTab === 'features' && (
                    <div style={{ maxHeight: '280px', overflowY: 'auto', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#F1F5F3', textAlign: 'left', color: 'var(--text-secondary)' }}>
                            <th style={{ padding: '8px 12px' }}>Feature Name</th>
                            <th style={{ padding: '8px 12px' }}>Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(urlResult.url_model?.model_features || {}).map(([key, val]) => (
                            <tr key={key} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                              <td style={{ padding: '6px 12px', fontFamily: 'monospace', color: 'var(--text-primary)' }}>{key}</td>
                              <td style={{ padding: '6px 12px', fontWeight: 600, color: 'var(--accent-primary)' }}>{String(val)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Web3 Proof Card */}
                  {renderWeb3ProofCard(web3UrlCommitment)}

                  {/* Actions Footer */}
                  <div style={{ 
                    marginTop: '18px', 
                    paddingTop: '16px', 
                    borderTop: '1px solid var(--border-light)', 
                    display: 'flex', 
                    justifyContent: 'flex-end',
                    flexWrap: 'wrap',
                    gap: '10px'
                  }}>
                    <button
                      onClick={handleCommitUrlToWeb3}
                      disabled={web3UrlLoading || !!web3UrlCommitment}
                      className="pill-action-btn"
                      style={{
                        backgroundColor: web3UrlCommitment ? '#064E3B' : '#047857',
                        color: '#FFFFFF',
                        padding: '8px 14px',
                        fontSize: '12px',
                        borderRadius: '8px',
                        cursor: (web3UrlLoading || !!web3UrlCommitment) ? 'default' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        border: 'none',
                        fontWeight: 600,
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {web3UrlLoading ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          <span>Anchoring to Sepolia...</span>
                        </>
                      ) : web3UrlCommitment ? (
                        <>
                          <CheckCircle2 size={14} style={{ color: '#34D399' }} />
                          <span>Anchored to Web3 Registry</span>
                        </>
                      ) : (
                        <>
                          <Lock size={14} />
                          <span>Anchor Report to Web3 Registry</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        if (onConsultCopilot) {
                          onConsultCopilot({
                            url: urlResult.target,
                            risk_score: urlResult.risk_score,
                            verdict: urlResult.verdict,
                            confidence: urlResult.confidence_percent,
                            is_impersonating: brandAlert?.is_impersonating,
                            target_brand: brandAlert?.target_brand,
                            reasons: urlResult.feature_highlights || urlResult.reasons
                          });
                        }
                      }}
                      className="pill-action-btn"
                      style={{
                        backgroundColor: '#1E293B',
                        color: '#F8FAFC',
                        padding: '8px 14px',
                        fontSize: '12px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Bot size={15} style={{ color: '#38BDF8' }} />
                      <span>Consult AI Security Copilot</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
                  <Search size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                  <p style={{ margin: 0, fontWeight: 600 }}>Ready for Live ML Analysis</p>
                  <p style={{ margin: '4px 0 0', fontSize: '12px' }}>
                    Enter any URL or IP above to trigger real-time 26-feature XGBoost & SHAP evaluation.
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: SCAM MESSAGE & SOCIAL ENGINEERING ANALYZER */}
      {/* ========================================================================= */}
      {activeScannerMode === 'message' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '20px' }}>
          
          {/* Left Column: Message Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="quixotic-card" style={{ padding: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Paste SMS, WhatsApp, or Email Text
              </label>
              
              <textarea
                rows={7}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Paste suspicious SMS, WhatsApp message, or email body to evaluate phishing lure..."
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '12px',
                  border: '1.5px solid var(--border-light)',
                  fontSize: '13px',
                  outline: 'none',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontFamily: 'Consolas, Monaco, monospace',
                  boxSizing: 'border-box',
                  resize: 'vertical'
                }}
              />

              <button
                onClick={handleAnalyzeMessage}
                disabled={msgLoading}
                type="button"
                style={{
                  width: '100%',
                  marginTop: '12px',
                  padding: '13px 20px',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-dark) 100%)',
                  color: '#FFFFFF',
                  border: '1px solid var(--accent-primary)',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: msgLoading ? 'not-allowed' : 'pointer',
                  opacity: msgLoading ? 0.75 : 1,
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                  transition: 'all 0.15s ease'
                }}
              >
                {msgLoading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Extracting Entities & Analyzing Lures...</span>
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    <span>Analyze Message -&gt;</span>
                  </>
                )}
              </button>

              {msgError && (
                <div style={{ 
                  marginTop: '12px', 
                  padding: '10px 14px', 
                  borderRadius: '8px', 
                  backgroundColor: 'var(--color-danger-bg)', 
                  color: 'var(--color-danger)', 
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertTriangle size={15} />
                  <span>{msgError}</span>
                </div>
              )}
            </div>

            {/* Detector Coverage Card */}
            <div className="quixotic-card" style={{ padding: '18px 20px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>
                Active NLP Scam Classifiers
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={14} style={{ color: 'var(--accent-primary)' }} />
                  <span>Automated URL extraction & XGBoost scoring</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={14} style={{ color: 'var(--accent-primary)' }} />
                  <span>Urgency & coercive psychological pressure lures</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={14} style={{ color: 'var(--accent-primary)' }} />
                  <span>Credential, OTP & UPI MPIN harvesting patterns</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={14} style={{ color: 'var(--accent-primary)' }} />
                  <span>Fake bank KYC, PAN & account block scams</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={14} style={{ color: 'var(--accent-primary)' }} />
                  <span>Lottery, prize & cashback refund lure models</span>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Live Message Analysis Output */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="quixotic-card" style={{ padding: '22px' }}>
              {msgLoading ? (
                <div style={{ textAlign: 'center', padding: '50px 20px' }}>
                  <RefreshCw size={36} className="animate-spin" style={{ color: 'var(--accent-primary)', margin: '0 auto 12px' }} />
                  <p style={{ fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                    Evaluating social engineering markers & embedded links...
                  </p>
                </div>
              ) : msgResult ? (
                <div>
                  {/* Verdict Banner */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    paddingBottom: '16px',
                    borderBottom: '1px solid var(--border-light)',
                    marginBottom: '16px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {isMsgMalicious ? (
                        <div style={{ 
                          width: '44px', 
                          height: '44px', 
                          borderRadius: '12px', 
                          backgroundColor: '#FEE2E2', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          color: '#DC2626'
                        }}>
                          <ShieldAlert size={26} />
                        </div>
                      ) : isMsgSuspicious ? (
                        <div style={{ 
                          width: '44px', 
                          height: '44px', 
                          borderRadius: '12px', 
                          backgroundColor: '#FEF3C7', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          color: '#D97706'
                        }}>
                          <AlertTriangle size={26} />
                        </div>
                      ) : (
                        <div style={{ 
                          width: '44px', 
                          height: '44px', 
                          borderRadius: '12px', 
                          backgroundColor: '#DCFCE7', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          color: '#16A34A'
                        }}>
                          <ShieldCheck size={26} />
                        </div>
                      )}

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ 
                            fontSize: '16px', 
                            fontWeight: 800, 
                            color: isMsgMalicious ? '#DC2626' : isMsgSuspicious ? '#D97706' : '#16A34A'
                          }}>
                            {msgResult.verdict}
                          </span>
                          <span style={{ 
                            fontSize: '11px', 
                            fontWeight: 700, 
                            padding: '2px 8px', 
                            borderRadius: '12px',
                            backgroundColor: isMsgMalicious ? '#FEE2E2' : isMsgSuspicious ? '#FEF3C7' : '#DCFCE7',
                            color: isMsgMalicious ? '#DC2626' : isMsgSuspicious ? '#D97706' : '#16A34A'
                          }}>
                            Confidence: {msgResult.confidence.toFixed(1)}%
                          </span>
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          Processing Latency: <strong>{msgResult.latency_ms}ms</strong>
                        </span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '28px', fontWeight: 900, color: isMsgMalicious ? '#DC2626' : isMsgSuspicious ? '#D97706' : '#16A34A', lineHeight: 1 }}>
                        {msgScore}
                        <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500 }}>/100</span>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                        Threat Score
                      </span>
                    </div>
                  </div>

                  {/* Detected Threat Badges */}
                  <div style={{ marginBottom: '14px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                      Detected Threat Classes:
                    </span>
                    {msgResult.detected_threats.length === 0 ? (
                      <span style={{ fontSize: '12px', color: '#16A34A', fontWeight: 600 }}>
                        ✓ No social engineering threat patterns detected
                      </span>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {msgResult.detected_threats.map((t, i) => (
                          <span 
                            key={i}
                            style={{ 
                              fontSize: '11px', 
                              fontWeight: 700, 
                              padding: '3px 8px', 
                              borderRadius: '6px', 
                              backgroundColor: '#FEE2E2', 
                              color: '#DC2626',
                              border: '1px solid #FECACA'
                            }}
                          >
                            ⚠️ {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Extracted Embedded URLs */}
                  <div style={{ marginBottom: '14px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                      Embedded Links ({msgResult.extracted_urls.length}):
                    </span>
                    {msgResult.extracted_urls.length === 0 ? (
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', padding: '8px 10px', backgroundColor: '#F8FAF9', borderRadius: '6px' }}>
                        No URLs detected in message body.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {msgResult.extracted_urls.map((u, i) => (
                          <div 
                            key={i}
                            style={{ 
                              padding: '8px 10px', 
                              borderRadius: '8px', 
                              border: '1px solid var(--border-light)',
                              backgroundColor: '#FFFFFF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}
                          >
                            <span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-primary)' }}>
                              {u.url}
                            </span>
                            <span style={{ 
                              fontSize: '10px', 
                              fontWeight: 800, 
                              padding: '2px 6px', 
                              borderRadius: '4px',
                              backgroundColor: u.verdict === 'MALICIOUS' ? '#FEE2E2' : '#DCFCE7',
                              color: u.verdict === 'MALICIOUS' ? '#DC2626' : '#16A34A'
                            }}>
                              {u.verdict} ({u.risk_score}/100)
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Safety Guidance Box */}
                  <div style={{ 
                    padding: '12px 14px', 
                    borderRadius: '10px', 
                    backgroundColor: isMsgMalicious ? '#FFF1F2' : isMsgSuspicious ? '#FEF3C7' : '#F0FDF4',
                    border: `1.5px solid ${isMsgMalicious ? '#FDA4AF' : isMsgSuspicious ? '#FDE68A' : '#BBF7D0'}`,
                    marginBottom: '16px'
                  }}>
                    <div style={{ fontWeight: 700, fontSize: '12px', color: isMsgMalicious ? '#9F1239' : isMsgSuspicious ? '#92400E' : '#166534', marginBottom: '4px' }}>
                      Recommended Safety Guidance:
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', color: isMsgMalicious ? '#881337' : isMsgSuspicious ? '#78350F' : '#14532D', lineHeight: 1.5 }}>
                      {msgResult.recommended_action}
                    </p>
                  </div>

                  {/* Web3 Proof Card */}
                  {renderWeb3ProofCard(web3MsgCommitment)}

                  {/* Actions Footer */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'flex-end',
                    flexWrap: 'wrap',
                    gap: '10px'
                  }}>
                    <button
                      onClick={handleCommitMsgToWeb3}
                      disabled={web3MsgLoading || !!web3MsgCommitment}
                      className="pill-action-btn"
                      style={{
                        backgroundColor: web3MsgCommitment ? '#064E3B' : '#047857',
                        color: '#FFFFFF',
                        padding: '8px 14px',
                        fontSize: '12px',
                        borderRadius: '8px',
                        cursor: (web3MsgLoading || !!web3MsgCommitment) ? 'default' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        border: 'none',
                        fontWeight: 600,
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {web3MsgLoading ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          <span>Anchoring to Sepolia...</span>
                        </>
                      ) : web3MsgCommitment ? (
                        <>
                          <CheckCircle2 size={14} style={{ color: '#34D399' }} />
                          <span>Anchored to Web3 Registry</span>
                        </>
                      ) : (
                        <>
                          <Lock size={14} />
                          <span>Anchor Report to Web3 Registry</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        if (onConsultCopilot) {
                          onConsultCopilot({
                            url: msgResult.extracted_urls[0]?.url || 'Scam Message Evaluation',
                            risk_score: msgResult.risk_score,
                            verdict: msgResult.verdict,
                            confidence: msgResult.confidence,
                            reasons: msgResult.detected_threats
                          });
                        }
                      }}
                      className="pill-action-btn"
                      style={{
                        backgroundColor: '#1E293B',
                        color: '#F8FAFC',
                        padding: '8px 14px',
                        fontSize: '12px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Bot size={15} style={{ color: '#38BDF8' }} />
                      <span>Consult AI Security Copilot</span>
                    </button>
                  </div>

                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
                  <MessageSquare size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                  <p style={{ margin: 0, fontWeight: 600 }}>Ready for Message Analysis</p>
                  <p style={{ margin: '4px 0 0', fontSize: '12px' }}>
                    Paste any suspicious message to extract lures, verify credential harvesting, and inspect embedded links.
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}

export default ThreatAnalyzer;
