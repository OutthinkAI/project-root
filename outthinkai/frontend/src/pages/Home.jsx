import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import ScenarioCard from "../components/ScenarioCard";
import Sidebar from "../components/Sidebar";
import { generateScenario } from "../api/client";

const features = [
  { label: "논리 오류 유형", value: "6가지", sub: "허수아비·권위·인과 등", color: "text-blue-600 dark:text-blue-400" },
  { label: "AI 응답 방식", value: "실시간", sub: "스트리밍 SSE", color: "text-violet-600 dark:text-violet-400" },
  { label: "평가 시스템", value: "PoT", sub: "Proof of Thought", color: "text-emerald-600 dark:text-emerald-400" },
  { label: "최대 토론 턴", value: "5회", sub: "완료 후 리포트 생성", color: "text-orange-600 dark:text-orange-400" },
];

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [loading, setLoading] = useState(false);
  const [generatedScenario, setGeneratedScenario] = useState(null);
  const navigate = useNavigate();

  const handleStartMission = async () => {
    if (topic.length < 2) return alert("분석할 주제를 2자 이상 입력해주세요.");
    setLoading(true);
    setGeneratedScenario(null);
    try {
      const data = await generateScenario(topic, difficulty);
      setGeneratedScenario(data);
    } catch (error) {
      console.error(error);
      alert("시나리오 생성에 실패했습니다. 백엔드 서버를 확인해주세요.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmScenario = () => {
    if (generatedScenario) {
      navigate(`/debate/${generatedScenario.session_id}`);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 flex flex-col min-w-0 overflow-auto">
        <div className="flex flex-col gap-8 p-6 md:p-10 max-w-[900px] mx-auto w-full">

          {/* 모바일 사이드바 열기 버튼 */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden self-start p-2 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>

          {/* 헤더 */}
          <div className="flex flex-col gap-2 pt-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[12px] font-medium text-emerald-600 dark:text-emerald-400">시스템 준비 완료</span>
            </div>
            <h1 className="text-[32px] md:text-[40px] font-bold tracking-tight text-gray-900 dark:text-white leading-tight">
              미션 센터
            </h1>
            <p className="text-[15px] text-gray-500 dark:text-gray-400">
              AI의 논리적 허점을 찾아 반박하여 비판적 사고력을 증명하세요.
            </p>
          </div>

          {/* 특징 카드 그리드 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {features.map((f) => (
              <div key={f.label} className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-1">{f.label}</p>
                <p className={`text-[22px] font-bold leading-tight ${f.color}`}>{f.value}</p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">{f.sub}</p>
              </div>
            ))}
          </div>

          {/* 미션 생성기 */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-6 flex flex-col gap-5">
            <div>
              <h2 className="text-[18px] font-semibold text-gray-900 dark:text-white">새 토론 시나리오 생성</h2>
              <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1">주제를 입력하면 AI가 논리 오류를 포함한 토론 시나리오를 생성합니다.</p>
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-[13px] font-medium text-gray-700 dark:text-gray-300">토론 주제</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleStartMission()}
                placeholder="예: 인공지능의 자아 인식과 윤리적 권리"
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 text-[15px] text-gray-900 dark:text-white outline-none focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition placeholder:text-gray-400 dark:placeholder:text-gray-600"
              />
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-[13px] font-medium text-gray-700 dark:text-gray-300">난이도</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'beginner', label: '초급' },
                  { id: 'intermediate', label: '중급' },
                  { id: 'advanced', label: '고급' },
                ].map((lv) => (
                  <button
                    key={lv.id}
                    onClick={() => setDifficulty(lv.id)}
                    className={`py-2.5 rounded-lg text-[13px] font-medium border transition-all ${
                      difficulty === lv.id
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-transparent text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600"
                    }`}
                  >
                    {lv.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleStartMission}
              disabled={loading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-[15px] rounded-lg transition-colors"
            >
              {loading ? '시나리오 생성 중...' : '시나리오 생성하기'}
            </button>
          </div>

          {/* 시나리오 표시 */}
          {generatedScenario && (
            <ScenarioCard scenarioData={generatedScenario} onConfirm={handleConfirmScenario} />
          )}

          {/* 가이드 */}
          {!generatedScenario && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
                <h3 className="text-[13px] font-semibold text-blue-600 dark:text-blue-400 mb-2">미션 목표</h3>
                <p className="text-[13px] text-gray-600 dark:text-gray-400 leading-relaxed">
                  AI 에이전트는 의도적으로 논리적 오류를 포함하여 주장합니다. 오류를 정확히 지적하고 타당한 근거를 제시하여 에이전트를 설득하세요.
                </p>
              </div>
              <div className="p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
                <h3 className="text-[13px] font-semibold text-emerald-600 dark:text-emerald-400 mb-2">점수 시스템</h3>
                <p className="text-[13px] text-gray-600 dark:text-gray-400 leading-relaxed">
                  오류 탐지 속도와 반박의 논리적 완성도에 따라 PoT(Proof of Thought) 점수가 부여됩니다. 5턴 후 AI가 종합 리포트를 생성합니다.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
