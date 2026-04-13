import React from "react";

export default function ScorePanel({ totalScore = 0, validator, sessionStatus }) {
  const feedback = validator?.feedback || "아직 반박을 제출하지 않았습니다.";

  return (
    <div className="flex flex-col gap-4 p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
      {/* 점수 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">PoT 점수</p>
          <p className="text-[32px] font-bold text-blue-600 dark:text-blue-400 leading-none mt-1">{totalScore}</p>
        </div>
        <div className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${
          sessionStatus === "completed"
            ? "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
            : "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
        }`}>
          {sessionStatus === "completed" ? "완료" : "진행 중"}
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
