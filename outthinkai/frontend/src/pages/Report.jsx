import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

const REPORT_STORAGE_PREFIX = "outthink-report:";

export default function Report() {
  const [searchParams] = useSearchParams();
  const [reportState, setReportState] = useState(null);

  const sessionId = searchParams.get("sessionId") || "";

  useEffect(() => {
    if (!sessionId || typeof window === "undefined") return;

    const saved = window.sessionStorage.getItem(`${REPORT_STORAGE_PREFIX}${sessionId}`);
    if (!saved) return;

    try {
      setReportState(JSON.parse(saved));
    } catch {
      setReportState(null);
    }
  }, [sessionId]);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background:
          "radial-gradient(circle at top, rgba(34, 197, 94, 0.18), transparent 24%), #071018",
        color: "#f4f7fb",
        fontFamily: "\"Segoe UI\", sans-serif",
      }}
    >
      <section
        style={{
          width: "min(760px, 100%)",
          padding: 28,
          borderRadius: 24,
          border: "1px solid rgba(148, 163, 184, 0.16)",
          background: "rgba(8, 15, 24, 0.92)",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            color: "#8fb7cc",
            fontSize: "0.75rem",
            textTransform: "uppercase",
            letterSpacing: "0.14em",
          }}
        >
          Session Report
        </span>

        <h1 style={{ margin: "10px 0 14px", fontSize: "2rem" }}>
          {reportState?.scenario?.topic || "Debate complete"}
        </h1>

        <p style={{ margin: 0, color: "#b8c8d8", lineHeight: 1.6 }}>
          {reportState?.report?.summary ||
            reportState?.completion?.message ||
            "The session_complete event was received and the debate moved here successfully."}
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 14,
            marginTop: 24,
          }}
        >
          <div
            style={{
              padding: 16,
              borderRadius: 18,
              background: "rgba(15, 23, 42, 0.74)",
            }}
          >
            <span style={{ display: "block", color: "#8fb7cc", fontSize: "0.8rem" }}>
              Session
            </span>
            <strong style={{ display: "block", marginTop: 8, fontSize: "1.4rem" }}>
              {sessionId || "-"}
            </strong>
          </div>

          <div
            style={{
              padding: 16,
              borderRadius: 18,
              background: "rgba(15, 23, 42, 0.74)",
            }}
          >
            <span style={{ display: "block", color: "#8fb7cc", fontSize: "0.8rem" }}>
              Total score
            </span>
            <strong style={{ display: "block", marginTop: 8, fontSize: "1.4rem" }}>
              {reportState?.session?.total_score || 0}
            </strong>
          </div>

          <div
            style={{
              padding: 16,
              borderRadius: 18,
              background: "rgba(15, 23, 42, 0.74)",
            }}
          >
            <span style={{ display: "block", color: "#8fb7cc", fontSize: "0.8rem" }}>
              Messages
            </span>
            <strong style={{ display: "block", marginTop: 8, fontSize: "1.4rem" }}>
              {reportState?.messages?.length || 0}
            </strong>
          </div>
        </div>
      </section>
    </main>
  );
}
