import React from "react";

const ROLE_META = {
  agent_a: {
    label: "Agent Alpha",
    initial: "A",
    avatarClass: "bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400",
    nameClass: "text-violet-600 dark:text-violet-400",
  },
  agent_b: {
    label: "Agent Bravo",
    initial: "B",
    avatarClass: "bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400",
    nameClass: "text-orange-600 dark:text-orange-400",
  },
  user: {
    label: "나",
    initial: "나",
    avatarClass: "bg-blue-600 text-white",
    nameClass: "text-blue-600 dark:text-blue-400",
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
    <div className={`flex gap-3 mb-5 ${isUser ? "flex-row-reverse" : ""}`}>
      {/* 아바타 */}
      <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[12px] font-semibold ${meta.avatarClass}`}>
        {meta.initial}
      </div>

      {/* 메시지 영역 */}
      <div className={`flex flex-col gap-1.5 max-w-[80%] ${isUser ? "items-end" : "items-start"}`}>
        {/* 이름 + 시간 */}
        <div className={`flex items-center gap-2 ${isUser ? "flex-row-reverse" : ""}`}>
          <span className={`text-[12px] font-medium ${meta.nameClass}`}>{displayName}</span>
          <span className="text-[11px] text-gray-400 dark:text-gray-600">{formatTime(createdAt)}</span>
          {isStreaming && (
            <span className="text-[11px] text-gray-400 dark:text-gray-500 italic animate-pulse">입력 중...</span>
          )}
        </div>

        {/* 말풍선 */}
        <div
          className={`px-4 py-3 rounded-2xl text-[14px] leading-relaxed whitespace-pre-wrap
            ${isUser
              ? "bg-blue-600 text-white rounded-tr-sm"
              : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700 rounded-tl-sm shadow-sm"
            }`}
        >
          {content || (isStreaming ? "..." : "")}
        </div>

        {/* 점수/피드백 */}
        {((typeof scoreDelta === "number" && scoreDelta > 0) || feedback) && (
          <div className="flex items-start gap-2 mt-1 px-1">
            {typeof scoreDelta === "number" && scoreDelta > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold">
                +{scoreDelta}점
              </span>
            )}
            {feedback && (
              <span className="text-[12px] text-gray-500 dark:text-gray-400 italic leading-relaxed">{feedback}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
