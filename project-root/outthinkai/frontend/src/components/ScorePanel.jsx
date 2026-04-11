import React from "react";

const SCORE_LABELS = [
  ["fallacy_identification", "Fallacy"],
  ["evidence_quality", "Evidence"],
  ["terminology_accuracy", "Terms"],
  ["speed_bonus", "Speed"],
];

export default function ScorePanel({ totalScore = 0, validator, sessionStatus }) {
  const breakdown = validator?.score_breakdown || {};
  const feedback = validator?.feedback || "Awaiting logic analysis payload...";

  return (
    <div className="flex flex-col gap-4 p-6 bg-white/[0.02] border border-white/10 relative overflow-hidden group hover:border-[#00aaff]/30 transition-colors">
      <div className="absolute top-0 right-0 p-2 opacity-10">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#00aaff" strokeWidth="1">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      </div>

      <div className="flex justify-between items-start z-10">
        <div className="flex flex-col">
          <span className="font-mono text-[10px] text-[#00aaff] tracking-[2px] uppercase">
            Live Validator
          </span>
          <h3 className="font-grotesk text-[18px] font-bold text-white mt-1">
            PoT Score
          </h3>
        </div>
        <span className="font-grotesk text-[32px] font-bold text-[#00ffaa] leading-none">
          {totalScore}
        </span>
      </div>

      {/* 세부 점수 그리드 */}
      <div className="grid grid-cols-2 gap-2 z-10">
        {SCORE_LABELS.map(([key, label]) => (
          <div key={key} className="p-3 bg-black border border-white/5 flex flex-col gap-1">
            <span className="font-mono text-[9px] text-white/40 uppercase tracking-widest">
              {label}
            </span>
            <span className="font-mono text-[14px] font-bold text-white">
              {breakdown[key] || 0}
            </span>
          </div>
        ))}
      </div>

      {/* 상태 태그 */}
      <div className="flex flex-wrap gap-2 z-10 mt-2">
        <span className={`px-2 py-1 font-mono text-[9px] uppercase border ${validator?.is_valid_rebuttal ? "bg-[#00ffaa]/10 border-[#00ffaa]/30 text-[#00ffaa]" : "bg-white/5 border-white/10 text-white/40"}`}>
          {validator?.is_valid_rebuttal ? "Valid Rebuttal" : "Pending Verify"}
        </span>
        <span className={`px-2 py-1 font-mono text-[9px] uppercase border ${validator?.fallacy_addressed ? "bg-[#ff00aa]/10 border-[#ff00aa]/30 text-[#ff00aa]" : "bg-white/5 border-white/10 text-white/40"}`}>
          {validator?.fallacy_addressed ? "Fallacy Targeted" : "Need Target"}
        </span>
        <span className="px-2 py-1 font-mono text-[9px] uppercase border bg-[#00aaff]/10 border-[#00aaff]/30 text-[#00aaff]">
          {sessionStatus === "completed" ? "Session Completed" : "Scoring Active"}
        </span>
      </div>

      {/* 피드백 텍스트 */}
      <div className="mt-2 pt-4 border-t border-white/10 z-10">
        <p className="font-mono text-[11px] text-white/60 leading-relaxed italic">
          {feedback}
        </p>
      </div>
    </div>
  );
}