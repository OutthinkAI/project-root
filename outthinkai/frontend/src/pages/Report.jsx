import React, { useState, useEffect } from "react";
import { useParams, Link, useSearchParams, useNavigate } from "react-router-dom";
import { getReport, generateReport } from "../api/client";
import Sidebar from "../components/Sidebar";

const FALLACY_KO = {
  appeal_to_authority: "권위에 호소",
  false_dichotomy: "거짓 이분법",
  hasty_generalization: "성급한 일반화",
  straw_man: "허수아비 논증",
  ad_hominem: "인신공격",
  slippery_slope: "미끄러운 경사면",
  circular_reasoning: "순환 논리",
  appeal_to_emotion: "감정에 호소",
  false_cause: "잘못된 인과관계",
  bandwagon: "다수에 호소",
};

const QUALITY_KO = { good: "우수", partial: "부분", poor: "미흡" };
const QUALITY_STYLE = {
  good: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
  partial: "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
  poor: "bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400",
};

function fallacyLabel(type) {
  return FALLACY_KO[type] || (type || "").replace(/_/g, " ");
}

// ---- 통계 그리드 ----
function StatsGrid({ score, fallacyCount }) {
  const grade = score >= 90 ? "A+" : score >= 80 ? "A" : score >= 70 ? "B" : "C";
  const gradeColor =
    score >= 80 ? "text-emerald-600 dark:text-emerald-400"
    : score >= 70 ? "text-blue-600 dark:text-blue-400"
    : "text-orange-600 dark:text-orange-400";

  const stats = [
    { label: "최종 PoT 점수", value: score, sub: "총 획득 점수", color: "text-blue-600 dark:text-blue-400" },
    { label: "논리 등급", value: grade, sub: "사고력 평가", color: gradeColor },
    { label: "탐지한 오류", value: fallacyCount, sub: "논리적 허점 수", color: "text-violet-600 dark:text-violet-400" },
    { label: "검증 상태", value: "완료", sub: "AI 엔진 인증", color: "text-emerald-600 dark:text-emerald-400" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat) => (
        <div key={stat.label} className="p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm flex flex-col items-center justify-center gap-1 text-center">
          <p className="text-[11px] text-gray-400 dark:text-gray-500">{stat.label}</p>
          <p className={`text-[30px] font-bold leading-none ${stat.color}`}>{stat.value}</p>
          <p className="text-[11px] text-gray-400 dark:text-gray-500">{stat.sub}</p>
        </div>
      ))}
    </div>
  );
}

// ---- 오류 탐지 로그 ----
function FallacyLog({ fallacies }) {
  if (!fallacies || fallacies.length === 0) return null;
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-gray-900 dark:text-white">탐지된 논리 오류</h3>
        <span className="text-[12px] text-gray-400 dark:text-gray-500">총 {fallacies.length}건</span>
      </div>
      <div className="flex flex-col divide-y divide-gray-100 dark:divide-gray-800">
        {fallacies.map((f, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4">
            <div className="w-8 h-8 rounded-full bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 flex-shrink-0 flex items-center justify-center text-[12px] font-bold">
              {f.turn}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-medium text-gray-900 dark:text-white">{fallacyLabel(f.fallacy_type)}</p>
              <p className="text-[12px] text-gray-400 dark:text-gray-500">{f.turn}번째 턴에서 탐지</p>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${QUALITY_STYLE[f.quality] || "bg-gray-100 dark:bg-gray-800 text-gray-500"}`}>
              {QUALITY_KO[f.quality] || f.quality}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- 강점/개선점 분석 ----
function CritiqueSection({ strengths, improvements }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-5">
        <h3 className="text-[13px] font-semibold text-emerald-600 dark:text-emerald-400 mb-4">논리적 강점</h3>
        <ul className="flex flex-col gap-3">
          {(strengths || []).map((s, i) => (
            <li key={i} className="flex gap-2.5 text-[13px] text-gray-600 dark:text-gray-300 leading-relaxed">
              <span className="text-emerald-500 flex-shrink-0 mt-0.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </span>
              {s}
            </li>
          ))}
        </ul>
      </div>
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-5">
        <h3 className="text-[13px] font-semibold text-orange-600 dark:text-orange-400 mb-4">개선 필요 영역</h3>
        <ul className="flex flex-col gap-3">
          {(improvements || []).map((imp, i) => (
            <li key={i} className="flex gap-2.5 text-[13px] text-gray-600 dark:text-gray-300 leading-relaxed">
              <span className="text-orange-500 flex-shrink-0 mt-0.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </span>
              {imp}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ---- 메인 Report 페이지 ----
export default function Report() {
  const { sessionId: pathId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorInfo, setErrorInfo] = useState({ type: null, msg: "" });
  const [certOpen, setCertOpen] = useState(false);

  const sessionId = pathId || searchParams.get("sessionId") || "";

  useEffect(() => {
    let isMounted = true;
    async function load() {
      if (!sessionId) {
        setLoading(false);
        setErrorInfo({ type: "BAD_REQUEST", msg: "유효하지 않은 세션 ID입니다." });
        return;
      }
      setLoading(true);

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
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 flex flex-col min-w-0 overflow-auto">

        {loading ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-12 h-12 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
              <div>
                <p className="text-[15px] font-medium text-gray-900 dark:text-white">분석 중...</p>
                <p className="text-[13px] text-gray-400 dark:text-gray-500 mt-1">AI 엔진이 토론 내용을 분석하고 있습니다.</p>
              </div>
            </div>
          </div>

        ) : errorInfo.type || !reportData ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-sm">
              <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-red-500">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <h2 className="text-[18px] font-semibold text-gray-900 dark:text-white mb-2">리포트를 불러올 수 없음</h2>
              <p className="text-[14px] text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">{errorInfo.msg}</p>
              <Link
                to="/"
                className="inline-block px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-[14px] rounded-lg transition-colors"
              >
                홈으로 돌아가기
              </Link>
            </div>
          </div>

        ) : (
          <div className="flex flex-col gap-6 p-6 md:p-10 max-w-[1000px] mx-auto w-full">

            {/* 모바일 사이드바 버튼 */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden self-start p-2 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>

            {/* 헤더 */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-[11px] font-semibold rounded-full">Proof of Thought</span>
                </div>
                <h1 className="text-[28px] md:text-[34px] font-bold tracking-tight text-gray-900 dark:text-white leading-tight">
                  사고 증명 리포트
                </h1>
                <p className="text-[14px] text-gray-500 dark:text-gray-400">분석이 완료되었습니다. 아래에서 결과를 확인하세요.</p>
              </div>
              <button
                onClick={() => navigate("/")}
                className="self-start md:self-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-[14px] rounded-lg transition-colors flex-shrink-0"
              >
                새 미션 시작
              </button>
            </div>

            {/* 종합 평가 요약 */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-6 border-l-4 border-l-blue-500">
              <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-2">종합 평가</p>
              <p className="text-[16px] text-gray-700 dark:text-gray-200 leading-relaxed italic">
                "{reportData.summary}"
              </p>
            </div>

            {/* 통계 */}
            <StatsGrid score={reportData.total_score} fallacyCount={reportData.fallacies_caught?.length || 0} />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 flex flex-col gap-6">
                {/* 오류 탐지 로그 */}
                <FallacyLog fallacies={reportData.fallacies_caught} />

                {/* 강점 / 개선점 */}
                <CritiqueSection strengths={reportData.strengths} improvements={reportData.improvements} />
              </div>

              {/* 우측 패널 */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                {/* PoT 인증서 */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600 dark:text-blue-400">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-gray-900 dark:text-white">PoT 인증서</p>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500">AI 엔진 검증 완료</p>
                    </div>
                  </div>
                  <div className="p-5 flex flex-col gap-3">
                    <div className="flex justify-between text-[12px]">
                      <span className="text-gray-400 dark:text-gray-500">발급 시각</span>
                      <span className="text-gray-700 dark:text-gray-300 font-medium">{new Date(reportData.created_at).toLocaleString("ko-KR")}</span>
                    </div>
                    <div className="flex justify-between text-[12px]">
                      <span className="text-gray-400 dark:text-gray-500">검증 엔진</span>
                      <span className="text-gray-700 dark:text-gray-300 font-medium">GPT-4O CORE</span>
                    </div>
                    <button
                      onClick={() => setCertOpen((v) => !v)}
                      className="mt-1 w-full py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-[13px] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      {certOpen ? "인증 정보 닫기 ▲" : "인증 상세 정보 ▼"}
                    </button>
                    {certOpen && (
                      <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex flex-col gap-2">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-gray-400 dark:text-gray-500">VALIDATOR</span>
                          <span className="text-gray-600 dark:text-gray-400">GPT-4O CORE</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-gray-400 dark:text-gray-500">GENERATED</span>
                          <span className="text-gray-600 dark:text-gray-400">{new Date(reportData.created_at).toLocaleString("ko-KR")}</span>
                        </div>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed mt-1">
                          본 분석 결과는 LogicDBG AI 엔진에 의해 검증되었습니다.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 다음 훈련 단계 */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-5">
                  <h3 className="text-[13px] font-semibold text-gray-900 dark:text-white mb-3">다음 훈련 단계</h3>
                  <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
                    {reportData.total_score >= 80
                      ? "우수한 논리력을 보여주셨습니다. 더 고난도의 논리 오류 유형에 도전해 실력을 높여보세요."
                      : reportData.total_score >= 50
                      ? "기본적인 오류 탐지 능력을 갖추고 있습니다. 개선 사항을 참고하여 반박 논리를 강화해보세요."
                      : "새로운 주제로 다시 도전하여 논리적 사고력을 단계적으로 향상시켜보세요."}
                  </p>
                  <button
                    onClick={() => navigate("/")}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-[13px] rounded-lg transition-colors"
                  >
                    새 미션 시작하기 →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}