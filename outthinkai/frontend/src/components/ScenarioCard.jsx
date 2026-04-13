import React from "react";

export default function ScenarioCard({ scenarioData, onConfirm }) {
  if (!scenarioData) return null;

  const { scenario, agent_a, agent_b } = scenarioData;

  return (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 12l2 2 4-4"/>
            </svg>
          </span>
          <span className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">시나리오 생성 완료</span>
        </div>

        <div className="p-6 flex flex-col gap-6">
          {/* 시나리오 설명 */}
          <p className="text-[15px] leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {scenario}
          </p>

          {/* 에이전트 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Agent A */}
            <div className="p-4 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-5 h-5 rounded-full bg-violet-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">A</span>
                <span className="text-[11px] font-medium text-violet-600 dark:text-violet-400 uppercase tracking-wide">Agent Alpha</span>
              </div>
              <h4 className="text-[15px] font-semibold text-gray-900 dark:text-white mb-1">{agent_a.name}</h4>
              <p className="text-[12px] text-gray-500 dark:text-gray-400 mb-3 italic">"{agent_a.persona}"</p>
              <div className="pt-3 border-t border-violet-200 dark:border-violet-800/50">
                <p className="text-[11px] font-medium text-violet-600 dark:text-violet-400 mb-1">초기 주장</p>
                <p className="text-[13px] text-gray-700 dark:text-gray-300">{agent_a.initial_claim}</p>
              </div>
            </div>

            {/* Agent B */}
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-5 h-5 rounded-full bg-orange-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">B</span>
                <span className="text-[11px] font-medium text-orange-600 dark:text-orange-400 uppercase tracking-wide">Agent Bravo</span>
              </div>
              <h4 className="text-[15px] font-semibold text-gray-900 dark:text-white mb-1">{agent_b.name}</h4>
              <p className="text-[12px] text-gray-500 dark:text-gray-400 mb-3 italic">"{agent_b.persona}"</p>
              <div className="pt-3 border-t border-orange-200 dark:border-orange-800/50">
                <p className="text-[11px] font-medium text-orange-600 dark:text-orange-400 mb-1">초기 주장</p>
                <p className="text-[13px] text-gray-700 dark:text-gray-300">{agent_b.initial_claim}</p>
              </div>
            </div>
          </div>

          {/* 시작 버튼 */}
          <button
            onClick={onConfirm}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[15px] rounded-lg transition-colors"
          >
            토론 시작하기 →
          </button>
        </div>
      </div>
    </div>
  );
}
