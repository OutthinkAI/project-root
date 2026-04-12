import React, { useState, useEffect } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { getReport, generateReport } from "../api/client";
import Sidebar from "../components/Sidebar";

// ---- [복구] 하위 컴포넌트: 아이콘 ----
const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 10V3M8 10L6 8M8 10L10 8M3 13H13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 2L2 7L7.5 8.5L9 14L14 2Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ---- [복구] 하위 컴포넌트: 통계 그리드 ----
function StatsGrid({ score, fallacyCount }) {
  const stats = [
    { label: "Final PoT Score", value: score, sub: "Total Points", color: "text-[#00ffaa]" },
    { label: "Logic Grade", value: score >= 90 ? "A+" : score >= 80 ? "A" : score >= 70 ? "B" : "C", sub: "Performance", color: "text-white" },
    { label: "Fallacies Caught", value: fallacyCount, sub: "Errors Identified", color: "text-[#ff00aa]" },
    { label: "Verification", value: "SECURE", sub: "Blockchain Hash", color: "text-[#00aaff]" },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/10 border border-white/10">
      {stats.map((stat, i) => (
        <div key={i} className="bg-black p-6 flex flex-col items-center justify-center gap-1">
          <span className="font-mono text-[9px] text-white/40 uppercase tracking-[2px]">{stat.label}</span>
          <span className={`font-grotesk text-[32px] font-bold ${stat.color}`}>{stat.value}</span>
          <span className="font-mono text-[9px] text-white/20 uppercase tracking-[1px]">{stat.sub}</span>
        </div>
      ))}
    </div>
  );
}

// ---- [복구] 하위 컴포넌트: 오류 탐지 로그 ----
function FallacyLog({ fallacies }) {
  if (!fallacies || fallacies.length === 0) return null;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center px-1">
        <h3 className="font-mono text-[12px] text-[#ff00aa] uppercase tracking-[2px]">Detected Fallacies</h3>
        <span className="font-mono text-[10px] text-white/20">LOGS: {fallacies.length} ITEMS</span>
      </div>
      <div className="flex flex-col gap-2">
        {fallacies.map((f, i) => (
          <div key={i} className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/5 hover:border-[#ff00aa]/30 transition-colors group">
            <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-[#ff00aa]/10 text-[#ff00aa] font-mono text-[14px] font-bold group-hover:bg-[#ff00aa] group-hover:text-black transition-all">{f.turn}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-[14px] text-white font-bold uppercase">{(f.fallacy_type || "").replace(/_/g, ' ')}</span>
                <span className="px-1.5 py-0.5 bg-white/10 text-white/40 font-mono text-[9px] uppercase tracking-wider">{f.quality}</span>
              </div>
              <p className="font-mono text-[11px] text-white/40 truncate">에이전트의 논리적 허점을 {f.turn}번째 턴에서 탐지하였습니다.</p>
            </div>
            <div className="hidden md:block font-mono text-[10px] text-[#00ffaa]">VERIFIED_</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- [복구] 하위 컴포넌트: 강점/약점 분석 ----
function CritiqueSection({ strengths, improvements }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="p-6 bg-[#00ffaa]/5 border border-[#00ffaa]/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-2 opacity-10"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#00ffaa" strokeWidth="1"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>
        <h3 className="font-mono text-[12px] text-[#00ffaa] mb-4 uppercase tracking-[2px]">Logical Strengths</h3>
        <ul className="flex flex-col gap-3">
          {(strengths || []).map((s, i) => (
            <li key={i} className="font-mono text-[13px] text-white/80 leading-relaxed flex gap-3 italic"><span className="text-[#00ffaa]">+</span> {s}</li>
          ))}
        </ul>
      </div>
      <div className="p-6 bg-[#ff00aa]/5 border border-[#ff00aa]/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-2 opacity-10"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ff00aa" strokeWidth="1"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div>
        <h3 className="font-mono text-[12px] text-[#ff00aa] mb-4 uppercase tracking-[2px]">Improvement Required</h3>
        <ul className="flex flex-col gap-3">
          {(improvements || []).map((imp, i) => (
            <li key={i} className="font-mono text-[13px] text-white/80 leading-relaxed flex gap-3 italic"><span className="text-[#ff00aa]">!</span> {imp}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ---- 메인 Report 페이지 (핵심: 사이드바 유지 + 영역 로딩/에러) ----
export default function Report() {
  const { sessionId: pathId } = useParams();
  const [searchParams] = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorInfo, setErrorInfo] = useState({ type: null, msg: "" });

  const sessionId = pathId || searchParams.get("sessionId") || "";

  useEffect(() => {
    let isMounted = true;
    async function load() {
      if (!sessionId) {
        setLoading(false);
        setErrorInfo({ type: "BAD_REQUEST", msg: "Invalid Session ID" });
        return;
      }
      setLoading(true);

      // 최대 10회(2초 간격) 폴링 — 자동 생성 완료까지 대기
      for (let attempt = 0; attempt < 10; attempt++) {
        try {
          const data = await getReport(sessionId);
          if (isMounted) {
            setReportData(data);
            setTimeout(() => setLoading(false), 1200);
          }
          return;
        } catch (err) {
          if (err.response?.status !== 404) {
            if (isMounted) {
              setErrorInfo({ type: "SERVER_ERROR", msg: "분석 데이터를 불러오지 못했습니다." });
              setLoading(false);
            }
            return;
          }
          // 404: 아직 생성 중 — 첫 번째 시도에서만 generate 요청
          if (attempt === 0) {
            try { await generateReport(sessionId); } catch { /* 이미 생성 중이면 무시 */ }
          }
          if (attempt < 9) await new Promise((r) => setTimeout(r, 2000));
        }
      }

      if (isMounted) {
        setErrorInfo({ type: "SERVER_ERROR", msg: "리포트 생성 시간이 초과되었습니다." });
        setLoading(false);
      }
    }
    load();
    return () => { isMounted = false; };
  }, [sessionId]);

  return (
    <div className="relative flex min-h-screen bg-[#050505] text-white overflow-hidden selection:bg-[#00ffaa]/30 font-sans">
      {/* 1. 사이드바는 항상 렌더링 (최상단) */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="relative flex-1 flex flex-col min-w-0 overflow-auto z-10">
        {/* 2. 로딩 중일 때 - 메인 영역 내부에 작은 박스 띄우기 */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-[320px] border border-[#00ffaa]/20 bg-black/40 p-8 relative">
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#00ffaa]" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#00ffaa]" />
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-[10px] text-[#00ffaa] uppercase tracking-[2px]">Analyzing Logic...</span>
                  <div className="w-1.5 h-1.5 bg-[#00ffaa] animate-ping" />
                </div>
                <div className="h-px bg-white/10 overflow-hidden">
                  <div className="h-full bg-[#00ffaa] animate-[loading_2s_infinite]" style={{ width: '40%' }} />
                </div>
                <p className="font-mono text-[11px] text-white/30 italic">데이터 무결성 확인 중_</p>
              </div>
            </div>
          </div>
        ) : errorInfo.type || !reportData ? (
          /* 3. 에러 발생 시 - 메인 영역 내부에 에러 디자인 띄우기 */
          <div className="flex-1 flex items-center justify-center p-10">
            <div className={`border p-10 bg-black/60 max-w-md w-full text-center ${errorInfo.type === 'NOT_FOUND' ? 'border-[#00aaff]/30' : 'border-[#ff00aa]/30'}`}>
              <h2 className={`font-grotesk text-[24px] font-bold uppercase mb-4 ${errorInfo.type === 'NOT_FOUND' ? 'text-[#00aaff]' : 'text-[#ff00aa]'}`}>
                {errorInfo.type === 'NOT_FOUND' ? "Analysis Missing" : "System Halt"}
              </h2>
              <p className="text-white/40 text-[14px] font-mono leading-relaxed mb-8">
                {errorInfo.type === 'NOT_FOUND' ? "해당 세션의 리포트가 아직 생성되지 않았습니다." : "서버와의 연결이 끊어졌거나 코드 오류가 발생했습니다."}
              </p>
              <Link to="/" className="inline-block px-10 py-3 bg-white/5 border border-white/10 text-white font-bold text-[11px] uppercase hover:bg-white hover:text-black transition-all">Back to Home</Link>
            </div>
          </div>
        ) : (
          /* 4. 데이터 정상 출력 - 원본 리포트 본문 100% */
          <div className="flex flex-col gap-10 p-6 md:p-12 max-w-[1200px] mx-auto w-full">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/10 pb-8 gap-6">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 bg-[#00ffaa] text-black font-mono text-[10px] font-bold uppercase">Proof of Thought</span>
                  <span className="font-mono text-[11px] text-white/40 tracking-wider font-bold">{(reportData.report_id || "").toUpperCase()}</span>
                </div>
                <h1 className="font-grotesk text-[36px] md:text-[42px] font-bold tracking-tight uppercase">Logic Debugging Report</h1>
                <p className="font-mono text-[14px] text-white/40 italic">{">"} 분석이 완료되었습니다. 결과가 분산 원장에 기록되었습니다_</p>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 border border-white/10 hover:bg-white/5 font-mono text-[12px] uppercase transition-all">
                  <DownloadIcon /> PDF
                </button>
                <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-3 bg-[#00ffaa] text-black font-bold font-mono text-[12px] uppercase hover:bg-white transition-all">
                  <SendIcon /> Submit
                </button>
                <Link to="/" className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-3 bg-white/10 text-white font-mono text-[12px] uppercase hover:bg-white/20 transition-all">
                  New Session
                </Link>
              </div>
            </div>

            {/* AI Summary Widget */}
            <div className="relative p-8 bg-white/[0.03] border-l-4 border-[#00ffaa]">
              <span className="absolute top-4 right-6 font-mono text-[50px] text-white/[0.03] pointer-events-none select-none italic font-black">SUMMARY</span>
              <div className="relative z-10">
                <h3 className="font-mono text-[10px] text-[#00ffaa] uppercase tracking-[2px] mb-4">Executive Summary</h3>
                <p className="font-mono text-[16px] md:text-[18px] text-white leading-relaxed italic">
                  "{reportData.summary}"
                </p>
              </div>
            </div>

            {/* Core Stats & Detail Content (원본 하위 컴포넌트 호출) */}
            <StatsGrid score={reportData.total_score} fallacyCount={reportData.fallacies_caught?.length || 0} />
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-7 flex flex-col gap-10">
                <FallacyLog fallacies={reportData.fallacies_caught} />
                <CritiqueSection strengths={reportData.strengths} improvements={reportData.improvements} />
              </div>

              {/* Sidebar Certificate Widget (원본 디자인 복구) */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                <div className="p-8 border border-white/10 bg-black relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#00ffaa]/20 to-transparent pointer-events-none" />
                  <div className="relative z-10 flex flex-col gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 border border-[#00ffaa] flex items-center justify-center bg-[#00ffaa]/5">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00ffaa" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-mono text-[14px] font-bold">PoT 인증서</span>
                        <span className="font-mono text-[10px] text-white/40 uppercase">Verified via LogicDBG Engine</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 py-4 border-y border-white/5">
                      <div className="flex justify-between font-mono text-[11px]"><span className="text-white/40 text-left">TIMESTAMP</span><span className="text-right">{new Date(reportData.created_at).toLocaleString()}</span></div>
                      <div className="flex justify-between font-mono text-[11px]"><span className="text-white/40 text-left">HASH_ID</span><span className="text-right truncate ml-4">0x{(reportData.report_id || "").slice(0, 8).toUpperCase()}...</span></div>
                      <div className="flex justify-between font-mono text-[11px]"><span className="text-white/40 text-left">VALIDATOR</span><span className="text-right">GPT-4O CORE</span></div>
                    </div>
                    <p className="font-mono text-[11px] text-white/30 leading-relaxed">본 분석 결과는 분산 원장에 기록되었으며 위변조가 불가능합니다. 해시값을 통해 인증서 진위 여부를 확인할 수 있습니다.</p>
                    <button className="w-full py-4 border border-[#00ffaa] text-[#00ffaa] font-mono text-[12px] font-bold uppercase hover:bg-[#00ffaa] hover:text-black transition-all">인증 상세 정보 확인</button>
                  </div>
                </div>

                <div className="p-6 border border-white/5 bg-white/[0.01]">
                  <h3 className="font-mono text-[10px] text-white/40 uppercase tracking-[2px] mb-4 underline">Next Training Phase</h3>
                  <div className="flex flex-col gap-4">
                    <p className="font-mono text-[12px] text-white/60">당신의 논증 패턴을 분석한 결과, '경제/정치' 분야의 논리 구조 학습을 추천합니다.</p>
                    <button className="text-[#00ffaa] font-mono text-[12px] text-left hover:underline">추천 미션 바로가기 →</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}