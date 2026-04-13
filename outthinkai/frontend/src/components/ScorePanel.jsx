import React from "react";

function fallbackBreakdown(validator) {
  if (!validator?.score_delta || !validator?.is_valid_rebuttal) return {};
  const score = Math.max(0, Math.min(40, validator.score_delta));
  const fallacy = validator.fallacy_addressed ? Math.min(16, Math.round(score * 0.4)) : 0;
  const evidence = Math.min(12, Math.round(score * 0.3));
  const terms = Math.min(8, Math.round(score * 0.2));
  const speed = Math.min(4, Math.max(0, score - fallacy - evidence - terms));
  return {
    fallacy_identification: fallacy,
    evidence_quality: evidence,
    terminology_accuracy: terms,
    speed_bonus: speed,
  };
}

export default function ScorePanel({ totalScore = 0, validator, sessionStatus, cumulativeBreakdown }) {
  const breakdown = cumulativeBreakdown || validator?.score_breakdown || fallbackBreakdown(validator);
  const feedback = validator?.feedback || "아직 반박을 제출하지 않았습니다.";
  const turnScoreDelta = validator?.turn_score_delta;

  return (
    <div className="flex flex-col gap-4 p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
      {/* 점수 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">PoT 점수</p>
          <p className="text-[32px] font-bold text-blue-600 dark:text-blue-400 leading-none mt-1">{totalScore}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${
            sessionStatus === "completed"
              ? "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
              : "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
          }`}>
            {sessionStatus === "completed" ? "완료" : "진행 중"}
          </div>
          {typeof turnScoreDelta === "number" && turnScoreDelta > 0 && (
            <div className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              턴 +{turnScoreDelta}
            </div>
          )}
        </div>
      </div>

      {/* 검증 결과 상태 칩 */}
      <div className="flex flex-wrap gap-2">
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium ${
          validator?.is_valid_rebuttal
            ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
            : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${validator?.is_valid_rebuttal ? "bg-emerald-500" : "bg-gray-400"}`} />
          {validator?.is_valid_rebuttal ? "유효한 반박" : "미검증"}
        </span>
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium ${
          validator?.fallacy_addressed
            ? "bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400"
            : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${validator?.fallacy_addressed ? "bg-violet-500" : "bg-gray-400"}`} />
          {validator?.fallacy_addressed ? "오류 지적 완료" : "오류 미지적"}
        </span>
      </div>

      {/* 피드백 */}
      <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
        <p className="text-[12px] text-gray-500 dark:text-gray-400 leading-relaxed italic">{feedback}</p>
      </div>
    </div>
  );
}