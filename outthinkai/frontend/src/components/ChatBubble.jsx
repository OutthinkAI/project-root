const ROLE_META = {
  agent_a: {
    label: "Agent A",
    badge: "A",
    accent: "#6ee7b7",
  },
  agent_b: {
    label: "Agent B",
    badge: "B",
    accent: "#f9a8d4",
  },
  user: {
    label: "You",
    badge: "U",
    accent: "#7dd3fc",
  },
};

function formatTime(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export default function ChatBubble({
  role,
  content,
  createdAt,
  isStreaming = false,
  feedback,
  scoreDelta,
}) {
  const meta = ROLE_META[role] || ROLE_META.user;

  return (
    <article
      style={{
        display: "grid",
        gridTemplateColumns: "44px minmax(0, 1fr)",
        gap: "14px",
        marginBottom: "18px",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          display: "grid",
          placeItems: "center",
          borderRadius: 14,
          fontWeight: 700,
          color: meta.accent,
          border: `1px solid ${meta.accent}`,
          background: "rgba(15, 23, 42, 0.76)",
        }}
      >
        {meta.badge}
      </div>

      <div style={{ minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
            alignItems: "center",
            marginBottom: "8px",
            fontSize: "0.82rem",
          }}
        >
          <strong>{meta.label}</strong>
          <span style={{ color: "#8fb7cc" }}>{formatTime(createdAt)}</span>
          {isStreaming ? <em style={{ color: "#8fb7cc", fontStyle: "normal" }}>streaming</em> : null}
        </div>

        <div
          style={{
            padding: "16px 18px",
            borderRadius: 18,
            border: `1px solid ${meta.accent}33`,
            borderLeft: `4px solid ${meta.accent}`,
            background: "rgba(8, 15, 24, 0.88)",
            color: "#f4f7fb",
          }}
        >
          <p style={{ margin: 0, lineHeight: 1.7 }}>{content || (isStreaming ? "..." : "")}</p>
          {typeof scoreDelta === "number" && scoreDelta > 0 ? (
            <small style={{ display: "block", marginTop: 10, color: "#9eb5c8" }}>
              score +{scoreDelta}
            </small>
          ) : null}
          {feedback ? (
            <small style={{ display: "block", marginTop: 10, color: "#9eb5c8" }}>{feedback}</small>
          ) : null}
        </div>
      </div>
    </article>
  );
}
