import React, { useState, useEffect } from "react";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Sidebar from "../components/Sidebar";

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

// ---- 메인 Home 컴포넌트 ---- //
export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleStartMission = async () => {
    if (topic.length < 2) return alert("분석할 주제를 2자 이상 입력해주세요.");
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/api/scenario/generate', { topic, difficulty });
      // PDF 스펙상 반환된 session_id로 이동
      navigate(`/debate/${response.data.session_id}`);
    } catch (error) {
      console.error(error);
      alert("시스템 엔진 연결 실패. 백엔드 서버를 확인하세요.");
    } finally {
      setLoading(false);
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

          {/* 가이드 메시지 위젯 */}
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
        </div>
      </main>
    </div>
  );
}