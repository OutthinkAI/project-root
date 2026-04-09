import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from 'react-router-dom';
import ScenarioCard from "../components/ScenarioCard";
import { generateScenario } from "../api/client";

// ---- 하위 컴포넌트: 라이브 클록 ---- //
function LiveClock() {
  const [time, setTime] = useState(() => new Date().toLocaleTimeString('ko-KR'));
  useEffect(() => {
    const id = setInterval(() => setTime(new Date().toLocaleTimeString('ko-KR')), 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="font-mono text-[14px] text-[#00ffaa] tracking-wider uppercase leading-5">{time}</span>;
}

// ---- 하위 컴포넌트: 통계 카드 ---- //
function StatCard({ label, value, sub, subGreen }) {
  return (
    <div className="relative flex flex-col gap-2 p-5 bg-white/[0.02] border border-white/10 overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-[#00ffaa]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative z-10 flex flex-col gap-1">
        <span className="font-mono text-[10px] text-white/40 tracking-[1px] uppercase">{label}</span>
        <span className="font-grotesk text-[32px] font-bold leading-tight text-white">{value}</span>
        <span className={`font-mono text-[10px] ${subGreen ? "text-[#00ffaa]" : "text-white/40"}`}>{sub}</span>
      </div>
      <div className="absolute bottom-0 right-0 w-12 h-12 border-r border-b border-[#00ffaa]/20 translate-x-6 translate-y-6 rotate-45" />
    </div>
  );
}

// ---- 하위 컴포넌트: 사이드바 (사용자 요청에 따라 파일 내 삽입) ---- //
const navItems = [
  {
    label: "미션 센터", href: "/", section: "메인",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
        <path d="M6.66667 2H2V6.66667H6.66667V2Z" stroke="currentColor" strokeWidth="0.666667"/>
        <path d="M14.0002 2H9.3335V6.66667H14.0002V2Z" stroke="currentColor" strokeWidth="0.666667"/>
        <path d="M6.66667 9.33337H2V14H6.66667V9.33337Z" stroke="currentColor" strokeWidth="0.666667"/>
        <path d="M14.0002 9.33337H9.3335V14H14.0002V9.33337Z" stroke="currentColor" strokeWidth="0.666667"/>
      </svg>
    ),
  },
  {
    label: "삼각 토론", href: "/debate", section: null,
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
        <path d="M5.33333 7.99996H5.34M8 7.99996H8.00667M10.6667 7.99996H10.6733M14 7.99996C14 10.9453 11.3133 13.3333 8 13.3333C7.01909 13.3366 6.04986 13.1205 5.16333 12.7006L2 13.3333L2.93 10.8533C2.34133 10.028 2 9.04929 2 7.99996C2 5.05463 4.68667 2.66663 8 2.66663C11.3133 2.66663 14 5.05463 14 7.99996Z" stroke="currentColor" strokeOpacity="0.6" strokeWidth="0.666667"/>
      </svg>
    ),
  },
  {
    label: "사고 증명", href: "/report/demo", section: null,
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
        <path d="M6.00016 11.3333V10M8.00016 11.3333V8.66667M10.0002 11.3333V7.33333M11.3335 14H4.66683C4.31321 14 3.97407 13.8595 3.72402 13.6095C3.47397 13.3594 3.3335 13.0203 3.3335 12.6667V3.33333C3.3335 2.97971 3.47397 2.64057 3.72402 2.39052C3.97407 2.14048 4.31321 2 4.66683 2H8.39083C8.56763 2.00004 8.73717 2.0703 8.86216 2.19533L12.4715 5.80467C12.5965 5.92966 12.6668 6.0992 12.6668 6.276V12.6667C12.6668 13.0203 12.5264 13.3594 12.2763 13.6095C12.0263 13.8595 11.6871 14 11.3335 14Z" stroke="currentColor" strokeOpacity="0.6" strokeWidth="0.666667"/>
      </svg>
    ),
  },
];

function Sidebar({ isOpen, onClose }) {
  const location = useLocation();

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}
      <aside className={`fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto w-64 flex flex-col flex-shrink-0 border-r border-white/10 bg-black/50 backdrop-blur-sm transition-transform duration-200 lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex flex-col gap-[3px] p-6 border-b border-white/10">
          <div className="font-mono text-[18px] font-bold leading-7">
            <span className="text-[#00ffaa]">LOGIC</span><span className="text-white/20">_</span><span className="text-[#ff00aa]">DBG</span>
          </div>
          <div className="font-mono text-[9px] font-normal text-white/30 tracking-[0.9px] uppercase">비판적 사고 훈련</div>
        </div>

        <div className="flex items-center gap-3 p-4 border-b border-white/10">
          <div className="w-10 h-10 flex items-center justify-center bg-[#00ffaa] flex-shrink-0">
            <span className="font-mono text-[16px] font-bold text-black">김</span>
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-[14px] font-medium text-white leading-5">김서연</span>
            <span className="font-mono text-[10px] text-[#00ffaa] uppercase leading-[15px]">LV.7 분석가</span>
          </div>
        </div>

        <nav className="flex-1 flex flex-col py-[15px]">
          <div className="px-4 mb-[15px]"><span className="font-mono text-[9px] text-white/30 tracking-[0.9px] uppercase">메인</span></div>
          <div className="flex flex-col">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link key={item.href} to={item.href} onClick={onClose} className={`flex items-center gap-3 px-4 py-3 relative ${isActive ? "bg-[#00ffaa]/5" : "hover:bg-white/5"} transition-colors`}>
                  <span className={isActive ? "text-white" : "text-white/60"}>{item.icon}</span>
                  {isActive && <div className="absolute left-0 top-[8.8px] w-[3px] h-[26px] bg-[#00ffaa]" />}
                  <span className={`font-mono text-[14px] font-normal leading-5 ${isActive ? "text-white" : "text-white/60"}`}>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="flex flex-col gap-1 p-4 border-t border-white/10">
          <div className="flex justify-between items-center">
            <span className="font-mono text-[9px] text-white/30">일일 할당량</span>
            <span className="font-mono text-[9px] text-[#00ffaa]">7/10</span>
          </div>
          <div className="h-1 bg-white/10 overflow-hidden">
            <div className="h-full bg-[#00ffaa]" style={{ width: "70%" }} />
          </div>
        </div>
      </aside>
    </>
  );
}

// ---- 메인 Home 컴포넌트 ---- //
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
      alert("시스템 엔진 연결 실패. 백엔드 서버를 확인하세요.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmScenario = () => {
    if (generatedScenario) {
      navigate(`/debate/${generatedScenario.session_id}`);
    }
  };

  const stats = [
    { label: "Total PoT", value: "2,847", sub: "+127 상승", subGreen: true },
    { label: "Accuracy", value: "89%", sub: "최근 5회 평균", subGreen: false },
    { label: "Global Rank", value: "#312", sub: "Top 4.2%", subGreen: true },
    { label: "Streak", value: "12 Days", sub: "Max 23", subGreen: false },
  ];

  return (
    <div className="relative flex min-h-screen bg-[#050505] text-white overflow-hidden selection:bg-[#00ffaa]/30 font-sans">
      {/* 배경 그리드 패턴 */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: "linear-gradient(rgba(0,255,170,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,170,0.3) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="relative flex-1 flex flex-col min-w-0 overflow-auto z-10">
        <div className="flex flex-col gap-10 p-6 md:p-12 max-w-[1200px] mx-auto w-full">
          
          {/* Header Section */}
          <div className="flex justify-between items-end border-b border-white/10 pb-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#00ffaa] animate-pulse" />
                <span className="font-mono text-[10px] text-[#00ffaa] tracking-[2px] uppercase">System Online</span>
              </div>
              <h1 className="font-grotesk text-[36px] md:text-[48px] font-bold leading-none tracking-tight">Mission Control</h1>
              <p className="font-mono text-[14px] text-white/40">{">"} 인공지능의 논리적 허점을 찾아 디버깅을 시작하십시오_</p>
            </div>
            <div className="hidden md:flex flex-col items-end">
              <span className="font-mono text-[10px] text-white/40 uppercase mb-1">Local Time</span>
              <LiveClock />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => <StatCard key={stat.label} {...stat} />)}
          </div>

          {/* Mission Generator (Main Widget) */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00ffaa]/20 to-[#ff00aa]/20 blur opacity-50 group-hover:opacity-100 transition duration-1000"></div>
            <div className="relative flex flex-col gap-8 p-8 md:p-12 bg-black border border-white/10 shadow-2xl">
              <div className="flex flex-col gap-2">
                <h2 className="font-grotesk text-[24px] font-bold">New Mission Initializing</h2>
                <p className="font-mono text-[12px] text-white/40 uppercase tracking-widest">학습하고자 하는 토론 주제를 입력하여 시나리오를 생성하십시오.</p>
              </div>

              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-3">
                  <label className="font-mono text-[10px] text-[#00ffaa] uppercase tracking-[1px]">Mission Topic</label>
                  <input 
                    type="text" value={topic} onChange={(e) => setTopic(e.target.value)}
                    placeholder="예: 인공지능의 자아 인식과 윤리적 권리"
                    className="w-full bg-white/[0.03] border border-white/10 p-5 text-white font-mono text-[18px] outline-none focus:border-[#00ffaa] transition-all placeholder:text-white/10"
                  />
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 flex flex-col gap-3">
                    <label className="font-mono text-[10px] text-white/40 uppercase tracking-[1px]">Complexity Level</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['beginner', 'intermediate', 'advanced'].map((lv) => (
                        <button 
                          key={lv} onClick={() => setDifficulty(lv)}
                          className={`py-3 font-mono text-[12px] uppercase border transition-all ${difficulty === lv ? "bg-[#00ffaa] text-black border-[#00ffaa]" : "bg-transparent text-white/40 border-white/10 hover:border-white/30"}`}
                        >
                          {lv === 'beginner' ? '초급' : lv === 'intermediate' ? '중급' : '고급'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 justify-end">
                    <button 
                      onClick={handleStartMission} disabled={loading}
                      className="h-[50px] px-10 bg-white text-black font-bold font-mono text-[14px] uppercase hover:bg-[#00ffaa] transition-all disabled:opacity-50"
                    >
                      {loading ? 'Analyzing...' : 'Execute Mission →'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Terminal Footer decor */}
              <div className="flex justify-between items-center pt-4 border-t border-white/5 opacity-30">
                <span className="font-mono text-[9px]">ENCRYPTION: AES-256</span>
                <span className="font-mono text-[9px]">READY FOR DEBATE_</span>
              </div>
            </div>
          </div>

          {/* Scenario Display */}
          {generatedScenario && (
            <ScenarioCard 
              scenarioData={generatedScenario} 
              onConfirm={handleConfirmScenario} 
            />
          )}

          {/* 가이드 메시지 위젯 */}
          {!generatedScenario && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 border border-white/5 bg-white/[0.01]">
                <h3 className="font-mono text-[12px] text-[#ff00aa] mb-3">MISSION OBJECTIVE</h3>
                <p className="font-mono text-[13px] text-white/60 leading-relaxed">
                  AI 에이전트는 의도적으로 논리적 오류를 포함하여 주장합니다. 당신의 목표는 그 오류를 정확히 지적하고 타당한 근거를 제시하여 에이전트를 설득하는 것입니다.
                </p>
              </div>
              <div className="p-6 border border-white/5 bg-white/[0.01]">
                <h3 className="font-mono text-[12px] text-[#00aaff] mb-3">SCORING SYSTEM</h3>
                <p className="font-mono text-[13px] text-white/60 leading-relaxed">
                  오류 탐지 속도와 반박의 논리적 완성도에 따라 PoT(Proof of Thought) 점수가 부여됩니다. 높은 등급의 분석가가 되어 새로운 사고 엔진을 잠금 해제하세요.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
