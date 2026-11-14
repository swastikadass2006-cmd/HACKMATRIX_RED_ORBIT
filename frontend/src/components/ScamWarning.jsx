import React, { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

export default function ScamWarning({ transactionId, onClose }) {
  const [language, setLanguage] = useState("en");
  const [warning, setWarning] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!transactionId) {
      setWarning(null);
      return;
    }

    const controller = new AbortController();

    const fetchAdvice = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${API_BASE}/api/ai/advice/${encodeURIComponent(transactionId)}?lang=${language}`,
          { signal: controller.signal }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || "Unable to fetch AI advice");
        }

        // Handle nested { advice: { headline, message, ... } } or flat structure
        const advicePayload = data.advice ? { ...data.advice, risk_score: data.risk_score } : data;
        setWarning(advicePayload);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message);
          setWarning(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchAdvice();

    return () => controller.abort();
  }, [transactionId, language]);

  if (!transactionId) {
    return (
      <div style={{ padding: "14px", backgroundColor: "#f0fdf4", borderRadius: "10px", border: "1px solid #bbf7d0", fontSize: "12px", color: "#166534" }}>
        <strong>🛡️ AI Scam Coach:</strong> Select or initiate a transaction to view real-time multilingual security advice.
      </div>
    );
  }

  return (
    <div style={{
      padding: "16px",
      borderRadius: "12px",
      backgroundColor: "#fffbeb",
      border: "1px solid #fde68a",
      boxShadow: "0 2px 10px rgba(245, 158, 11, 0.08)",
      margin: "12px 0",
      fontFamily: "system-ui, sans-serif"
    }}>
      {/* Track 2 Badge */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <span style={{
          fontSize: "10px",
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          padding: "3px 8px",
          borderRadius: "6px",
          backgroundColor: "#fef3c7",
          color: "#92400e",
          border: "1px solid #fcd34d"
        }}>
          Track 2: Financial Inclusion • Gemini AI Scam Coach
        </span>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={{
              padding: "4px 8px",
              borderRadius: "6px",
              border: "1px solid #d97706",
              backgroundColor: "#ffffff",
              fontSize: "11px",
              fontWeight: 600,
              color: "#92400e",
              cursor: "pointer"
            }}
          >
            <option value="en">English (Default)</option>
            <option value="hi">हिन्दी (Hindi)</option>
            <option value="bn">বাংলা (Bengali)</option>
          </select>
          {onClose && (
            <button
              onClick={onClose}
              style={{ background: "none", border: "none", color: "#92400e", cursor: "pointer", fontSize: "14px", fontWeight: "bold" }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div style={{ fontSize: "12px", color: "#b45309", padding: "10px 0" }}>
          🤖 Generating localized safety explanation via Gemini API...
        </div>
      )}

      {error && (
        <div style={{ fontSize: "12px", color: "#dc2626", padding: "6px 0" }}>
          ⚠️ Notice: {error}
        </div>
      )}

      {warning && (
        <div>
          <h4 style={{ margin: "0 0 6px 0", fontSize: "14px", fontWeight: 700, color: "#92400e" }}>
            {warning.headline || "Suspicious Activity Detected"}
          </h4>
          <p style={{ margin: "0 0 10px 0", fontSize: "12.5px", color: "#78350f", lineHeight: "1.5" }}>
            {warning.message}
          </p>

          {warning.do_this_now && warning.do_this_now.length > 0 && (
            <div style={{ backgroundColor: "#ffffff", padding: "10px 12px", borderRadius: "8px", border: "1px solid #fef08a" }}>
              <strong style={{ fontSize: "11.5px", color: "#92400e", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "4px" }}>
                Immediate Safety Steps:
              </strong>
              <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12px", color: "#451a03", display: "flex", flexDirection: "column", gap: "4px" }}>
                {warning.do_this_now.map((action, index) => (
                  <li key={index}>{action}</li>
                ))}
              </ul>
            </div>
          )}

          <div style={{ marginTop: "8px", fontSize: "10.5px", color: "#a16207", display: "flex", justifyContent: "space-between" }}>
            <span>Localized Language: {warning.language?.toUpperCase() || language.toUpperCase()}</span>
            <span>Zero PIN / OTP Disclosure Guaranteed</span>
          </div>
        </div>
      )}
    </div>
  );
}
