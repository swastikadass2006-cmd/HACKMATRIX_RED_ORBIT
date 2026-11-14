import React from "react";

export default function MuleGraph({ graphData = { nodes: [], edges: [] } }) {
  const nodes = (graphData?.nodes || []).slice(0, 16);
  const edges = graphData?.edges || [];
  const width = 440,
    height = 280,
    cx = width / 2,
    cy = height / 2,
    radius = 98;

  const nodeCoords = {};
  nodes.forEach((n, i) => {
    const angle = (2 * Math.PI * i) / Math.max(nodes.length, 1);
    nodeCoords[n.id] = {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
      is_flagged: n.is_flagged,
    };
  });

  const visibleEdges = edges.filter(
    (e) => nodeCoords[e.source] && nodeCoords[e.target]
  );

  return (
    <div
      style={{
        background: "var(--bg-panel-dark)",
        padding: "16px",
        borderRadius: "var(--radius-sm)",
        color: "var(--text-slate-light)",
        border: "1px solid var(--border-dark)",
        fontFamily: "var(--font-family)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "8px",
        }}
      >
        <span style={{ fontSize: "14px", fontWeight: "600" }}>
          Live Mule & Fan-In Topology
        </span>
        <span style={{ fontSize: "11px", color: "var(--accent-red-bright)", fontWeight: "600" }}>
          ● Flagged: Rapid Hop (&lt;60s) / Fan-In (4+)
        </span>
      </div>

      {nodes.length === 0 ? (
        <div
          style={{
            height,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-slate-muted)",
            fontSize: "12px",
          }}
        >
          Waiting for transaction stream…
        </div>
      ) : (
        <svg aria-hidden="true" width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
          <defs>
            <marker
              id="arrow-red"
              markerWidth="8"
              markerHeight="8"
              refX="14"
              refY="4"
              orient="auto"
            >
              <path d="M0,0 L8,4 L0,8 Z" fill="var(--accent-red-bright)" />
            </marker>
            <marker
              id="arrow-slate"
              markerWidth="6"
              markerHeight="6"
              refX="14"
              refY="3"
              orient="auto"
            >
              <path d="M0,0 L6,3 L0,6 Z" fill="var(--border-dark)" />
            </marker>
          </defs>

          {visibleEdges.map((e, i) => {
            const s = nodeCoords[e.source];
            const t = nodeCoords[e.target];
            return (
              <line
                key={i}
                x1={s.x}
                y1={s.y}
                x2={t.x}
                y2={t.y}
                stroke={e.is_flagged ? "var(--accent-red-bright)" : "var(--border-dark)"}
                strokeWidth={e.is_flagged ? 2.5 : 1.2}
                markerEnd={e.is_flagged ? "url(#arrow-red)" : "url(#arrow-slate)"}
              />
            );
          })}

          {nodes.map((n) => {
            const { x, y, is_flagged } = nodeCoords[n.id];
            return (
              <g key={n.id}>
                <circle
                  cx={x}
                  cy={y}
                  r={is_flagged ? 9 : 6}
                  fill={is_flagged ? "var(--accent-red-bright)" : "var(--accent-blue)"}
                  stroke="var(--bg-panel-dark)"
                  strokeWidth="2"
                />
                <text
                  x={x}
                  y={y - 12}
                  textAnchor="middle"
                  fill="var(--text-slate-code)"
                  fontSize="10px"
                >
                  {String(n.id).split("@")[0]}
                </text>
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}