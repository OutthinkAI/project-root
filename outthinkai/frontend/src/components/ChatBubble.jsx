import React from "react";

const ROLE_META = {
  agent_a: {
    label: "Agent Alpha",
    badge: "A",
    color: "#00ffaa",
    borderClass: "border-[#00ffaa]",
    textClass: "text-[#00ffaa]",
    bgClass: "bg-[#00ffaa]/5",
  },
  agent_b: {
    label: "Agent Bravo",
    badge: "B",
    color: "#ff00aa",
    borderClass: "border-[#ff00aa]",
    textClass: "text-[#ff00aa]",
    bgClass: "bg-[#ff00aa]/5",
  },
  user: {
    label: "You (Analyst)",
    badge: "U",
    color: "#00aaff",
    borderClass: "border-[#00aaff]",
    textClass: "text-[#00aaff]",
    bgClass: "bg-[#00aaff]/5",
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
  agentName,
}) {
  const meta = ROLE_META[role] || ROLE_META.user;
  const displayName = agentName || meta.label;
  const isUser = role === "user";

  return (
    <div className={`flex gap-4 mb-4 group ${isUser ? "flex-row-reverse" : ""}`}>
      {/* 아바타 영역 */}
      <div
        className={`w-10 h-10 flex-shrink-0 flex items-center justify-center border ${meta.borderClass} ${meta.bgClass} transition-colors group-hover:bg-opacity-20`}
      >
        <span className={`font-mono text-[14px] font-bold ${meta.textClass}`}>
          {meta.badge}
        </span>
      </div>

      {/* 메시지 영역 */}
      <div className={`flex-1 min-w-0 flex flex-col gap-1.5 ${isUser ? "items-end" : "items-start"}`}>
        {/* 헤더 (이름, 시간) */}
        <div className={`flex items-center gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
          <span className={`font-mono text-[11px] font-bold uppercase tracking-wider ${meta.textClass}`}>
            {displayName}
          </span>
          <span className="font-mono text-[10px] text-white/30">
            {formatTime(createdAt)}
          </span>
          {isStreaming && (
            <span className="font-mono text-[10px] text-white/50 animate-pulse italic">
              receiving...
            </span>
          )}
        </div>

        {/* 말풍선 본문 (무조건 왼쪽 정렬로 고정) */}
        <div className={`p-4 bg-white/[0.02] border border-white/5 whitespace-pre-wrap font-sans text-[14px] text-white/80 leading-relaxed group-hover:border-white/10 transition-colors max-w-[85%] text-left`}>
          {content || (isStreaming ? "..." : "")}
        </div>

        {/* 점수 및 피드백 영역 (시스템 뱃지 스타일 - 가운데 정렬 & 네온 발광) */}
        {(typeof scoreDelta === "number" && scoreDelta > 0) || feedback ? (
          <div className="mt-3 p-4 bg-[#00ffaa]/[0.02] border border-[#00ffaa]/40 shadow-[0_0_15px_rgba(0,255,170,0.15)] flex flex-col items-center justify-center text-center gap-2 w-full max-w-[85%] self-center backdrop-blur-sm relative overflow-hidden">
            {/* 장식용 코너 포인트 */}
            <div className="absolute top-0 left-0 w-1 h-1 border-t border-l border-[#00ffaa]"></div>
            <div className="absolute bottom-0 right-0 w-1 h-1 border-b border-r border-[#00ffaa]"></div>

            {typeof scoreDelta === "number" && scoreDelta > 0 && (
              <span className="font-mono text-[11px] font-bold text-[#00ffaa] uppercase tracking-[1px]">
                + {scoreDelta} PoT Score Gained
              </span>
            )}
            
            {feedback && (
              <span className="font-mono text-[11px] text-[#00aaff] italic flex items-center justify-center gap-2">
                <span className="text-white/20">{"//"}</span>
                {feedback}
                <span className="text-white/20">{"//"}</span>
              </span>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}