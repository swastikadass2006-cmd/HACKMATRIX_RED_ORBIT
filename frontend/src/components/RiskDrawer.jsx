import React from "react";

export default function RiskDrawer({ txn, onClose }) {
  if (!txn) return null;

  const score = txn.score ?? 0;
  const badgeColor =
    score > 75 ? "#ef4444" : score >= 40 ? "#f59e0b" : "#10b981";

  return (
    <div
      style={{
        borderLeft: "1px solid #334155",
        background: "#0f172a",
        color: "#f8fafc",
        padding: "16px",
        width: "340px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0, fontSize: "16px" }}>Risk Breakdown</h3>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            ✕
          </button>
        )}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          background: "#1e293b",
          padding: "12px",
          borderRadius: "8px",
        }}
      >
        <div>
          <div style={{ fontSize: "11px", color: "#94a3b8", letterSpacing: "0.05em" }}>
            RISK SCORE
          </div>
          <div style={{ fontSize: "28px", fontWeight: "bold", color: badgeColor }}>
            {score} <span style={{ fontSize: "14px", color: "#64748b" }}>/ 100</span>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "12px", fontWeight: "700", color: badgeColor }}>
            {txn.state || txn.decision || "SCORED"}
          </div>
          <div style={{ fontSize: "11px", color: "#64748b" }}>
            p99: {txn.latency_ms ?? 0.4} ms
          </div>
        </div>
      </div>

      <div style={{ fontSize: "12px", color: "#cbd5e1", lineHeight: "1.6" }}>
        <div><strong>Txn ID:</strong> {txn.txn_id}</div>
        <div><strong>Route:</strong> {txn.sender_vpa} → {txn.receiver_vpa}</div>
        <div><strong>Amount:</strong> ₹{Number(txn.amount || 0).toLocaleString("en-IN")}</div>
      </div>

      <div style={{ fontSize: "13px", fontWeight: "600", marginTop: "4px" }}>
        Triggered Risk Signals
      </div>

      {!txn.reasons || txn.reasons.length === 0 ? (
        <div
          style={{
            fontSize: "12px",
            color: "#64748b",
            background: "#1e293b",
            padding: "10px",
            borderRadius: "6px",
          }}
        >
          No anomalies detected. Matches user baseline.
        </div>
      ) : (
        txn.reasons.map((r, idx) => (
          <div
            key={idx}
            style={{ background: "#1e293b", padding: "8px 10px", borderRadius: "6px" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "12px",
                marginBottom: "6px",
              }}
            >
              <span>{r.label || r.code}</span>
              <span style={{ fontWeight: "bold", color: "#f87171" }}>+{r.weight}</span>
            </div>
            <div
              style={{
                background: "#334155",
                height: "5px",
                borderRadius: "3px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${Math.min(100, (r.weight / 50) * 100)}%`,
                  background: badgeColor,
                  height: "100%",
                }}
              />
            </div>
          </div>
        ))
      )}
    </div>
  );
}