import React from "react";
import { Link, useLocation } from "react-router-dom";

const navItems = [
  {
    label: "미션 센터", href: "/",
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
    label: "삼각 토론", href: "/debate",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
        <path d="M5.33333 7.99996H5.34M8 7.99996H8.00667M10.6667 7.99996H10.6733M14 7.99996C14 10.9453 11.3133 13.3333 8 13.3333C7.01909 13.3366 6.04986 13.1205 5.16333 12.7006L2 13.3333L2.93 10.8533C2.34133 10.028 2 9.04929 2 7.99996C2 5.05463 4.68667 2.66663 8 2.66663C11.3133 2.66663 14 5.05463 14 7.99996Z" stroke="currentColor" strokeOpacity="0.6" strokeWidth="0.666667"/>
      </svg>
    ),
  },
  {
    label: "사고 증명", href: "/report",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
        <path d="M6.00016 11.3333V10M8.00016 11.3333V8.66667M10.0002 11.3333V7.33333M11.3335 14H4.66683C4.31321 14 3.97407 13.8595 3.72402 13.6095C3.47397 13.3594 3.3335 13.0203 3.3335 12.6667V3.33333C3.3335 2.97971 3.47397 2.64057 3.72402 2.39052C3.97407 2.14048 4.31321 2 4.66683 2H8.39083C8.56763 2.00004 8.73717 2.0703 8.86216 2.19533L12.4715 5.80467C12.5965 5.92966 12.6668 6.0992 12.6668 6.276V12.6667C12.6668 13.0203 12.5264 13.3594 12.2763 13.6095C12.0263 13.8595 11.6871 14 11.3335 14Z" stroke="currentColor" strokeOpacity="0.6" strokeWidth="0.666667"/>
      </svg>
    ),
  },
];

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}
      <aside className={`fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto w-64 flex flex-col flex-shrink-0 border-r border-white/10 bg-black/50 backdrop-blur-sm transition-transform duration-200 lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>

        {/* 로고 */}
        <div className="flex flex-col gap-[3px] p-6 border-b border-white/10">
          <div className="font-mono text-[18px] font-bold leading-7">
            <span className="text-[#00ffaa]">LOGIC</span><span className="text-white/20">_</span><span className="text-[#ff00aa]">DBG</span>
          </div>
          <div className="font-mono text-[9px] font-normal text-white/30 tracking-[0.9px] uppercase">비판적 사고 훈련 플랫폼</div>
        </div>

        {/* 시스템 상태 */}
        <div className="flex items-center gap-3 p-4 border-b border-white/10">
          <div className="w-2 h-2 bg-[#00ffaa] animate-pulse flex-shrink-0" />
          <div className="flex flex-col">
            <span className="font-mono text-[12px] font-medium text-white/80 leading-5">SYSTEM ONLINE</span>
            <span className="font-mono text-[10px] text-[#00ffaa] uppercase leading-[15px]">Logic Debugger v1.0</span>
          </div>
        </div>

        {/* 네비게이션 */}
        <nav className="flex-1 flex flex-col py-[15px]">
          <div className="px-4 mb-[15px]">
            <span className="font-mono text-[9px] text-white/30 tracking-[0.9px] uppercase">메인</span>
          </div>
          <div className="flex flex-col">
            {navItems.map((item) => {
              const isActive =
                location.pathname === item.href ||
                (item.href !== "/" && location.pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-4 py-3 relative ${isActive ? "bg-[#00ffaa]/5" : "hover:bg-white/5"} transition-colors`}
                >
                  <span className={isActive ? "text-white" : "text-white/60"}>{item.icon}</span>
                  {isActive && <div className="absolute left-0 top-[8.8px] w-[3px] h-[26px] bg-[#00ffaa]" />}
                  <span className={`font-mono text-[14px] font-normal leading-5 ${isActive ? "text-white" : "text-white/60"}`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* 하단 안내 */}
        <div className="p-4 border-t border-white/10">
          <p className="font-mono text-[9px] text-white/20 leading-relaxed">
            AI의 논리적 허점을 찾아<br />반박하여 사고력을 증명하십시오.
          </p>
        </div>
      </aside>
    </>
  );
}
