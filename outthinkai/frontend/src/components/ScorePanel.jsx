const SCORE_LABELS = [
  ["fallacy_identification", "Fallacy"],
  ["evidence_quality", "Evidence"],
  ["terminology_accuracy", "Terms"],
  ["speed_bonus", "Speed"],
];

export default function ScorePanel({ totalScore = 0, validator, sessionStatus }) {
  const breakdown = validator?.score_breakdown || {};
  const feedback = validator?.feedback || "Validator feedback will appear here in real time.";

  return (
    <section
      style={{
        padding: 18,
        borderRadius: 20,
        border: "1px solid rgba(148, 163, 184, 0.16)",
        background: "rgba(10, 18, 28, 0.92)",
        color: "#f4f7fb",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          alignItems: "flex-start",
          marginBottom: 16,
        }}
      >
        <div>
          <span
            style={{
              display: "inline-flex",
              fontSize: "0.75rem",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#8fb7cc",
            }}
          >
            Validator
          </span>
          <h3 style={{ margin: "10px 0 0", fontSize: "1.2rem" }}>Score Panel</h3>
        </div>
        <strong style={{ fontSize: "2rem", color: "#6ee7b7" }}>{totalScore}</strong>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 12,
          marginBottom: 16,
        }}
      >
        {SCORE_LABELS.map(([key, label]) => (
          <div
            key={key}
            style={{
              padding: 12,
              borderRadius: 16,
              background: "rgba(15, 23, 42, 0.72)",
            }}
          >
            <span style={{ display: "block", color: "#8fb7cc", fontSize: "0.78rem" }}>{label}</span>
            <strong style={{ display: "block", marginTop: 6, fontSize: "1.3rem" }}>
              {breakdown[key] || 0}
            </strong>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gap: 8, marginBottom: 14 }}>
        <span
          style={{
            display: "inline-flex",
            width: "fit-content",
            padding: "8px 10px",
            borderRadius: 999,
            background: "rgba(19, 78, 74, 0.34)",
            color: "#d9fff1",
            fontSize: "0.78rem",
          }}
        >
          {validator?.is_valid_rebuttal ? "Valid rebuttal" : "Review pending"}
        </span>
        <span
          style={{
            display: "inline-flex",
            width: "fit-content",
            padding: "8px 10px",
            borderRadius: 999,
            background: "rgba(19, 78, 74, 0.34)",
            color: "#d9fff1",
            fontSize: "0.78rem",
          }}
        >
          {validator?.fallacy_addressed ? "Fallacy addressed" : "Need stronger targeting"}
        </span>
        <span
          style={{
            display: "inline-flex",
            width: "fit-content",
            padding: "8px 10px",
            borderRadius: 999,
            background: "rgba(19, 78, 74, 0.34)",
            color: "#d9fff1",
            fontSize: "0.78rem",
          }}
        >
          {sessionStatus === "completed" ? "Session completed" : "Live scoring active"}
        </span>
      </div>

      <p style={{ margin: 0, color: "#b8c8d8", lineHeight: 1.6 }}>{feedback}</p>
    </section>
  );
}
