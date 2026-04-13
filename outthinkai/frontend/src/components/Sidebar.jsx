import React from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useDarkMode } from "../App";

const NAV_ITEMS = [
  {
    label: "미션 센터",
    href: "/",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
        <path d="M6.66667 2H2V6.66667H6.66667V2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
        <path d="M14.0002 2H9.3335V6.66667H14.0002V2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
        <path d="M6.66667 9.33337H2V14H6.66667V9.33337Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
        <path d="M14.0002 9.33337H9.3335V14H14.0002V9.33337Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    label: "삼각 토론",
    href: "/debate",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
        <path d="M5.33333 7.99996H5.34M8 7.99996H8.00667M10.6667 7.99996H10.6733M14 7.99996C14 10.9453 11.3133 13.3333 8 13.3333C7.01909 13.3366 6.04986 13.1205 5.16333 12.7006L2 13.3333L2.93 10.8533C2.34133 10.028 2 9.04929 2 7.99996C2 5.05463 4.68667 2.66663 8 2.66663C11.3133 2.66663 14 5.05463 14 7.99996Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    label: "사고 증명",
    href: "/report",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
        <path d="M6.00016 11.3333V10M8.00016 11.3333V8.66667M10.0002 11.3333V7.33333M11.3335 14H4.66683C4.31321 14 3.97407 13.8595 3.72402 13.6095C3.47397 13.3594 3.3335 13.0203 3.3335 12.6667V3.33333C3.3335 2.97971 3.47397 2.64057 3.72402 2.39052C3.97407 2.14048 4.31321 2 4.66683 2H8.39083C8.56763 2.00004 8.73717 2.0703 8.86216 2.19533L12.4715 5.80467C12.5965 5.92966 12.6668 6.0992 12.6668 6.276V12.6667C12.6668 13.0203 12.5264 13.3594 12.2763 13.6095C12.0263 13.8595 11.6871 14 11.3335 14Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
      <circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const { sessionId } = useParams();

  const navItems = NAV_ITEMS.map((item) => {
    if (item.href === "/debate" && sessionId) {
      return { ...item, href: `/debate/${sessionId}` };
    }
    return item;
  });
  const { dark, toggle } = useDarkMode();

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto w-60 flex flex-col flex-shrink-0
          border-r border-gray-200 dark:border-gray-800
          bg-white dark:bg-gray-950
          transition-transform duration-200 lg:translate-x-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* 로고 */}
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 12l2 2 4-4"/><path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/>
            </svg>
          </div>
          <div>
            <div className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight">OutThinkAI</div>
            <div className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight">비판적 사고 훈련</div>
          </div>
        </div>

        {/* 네비게이션 */}
        <nav className="flex-1 flex flex-col p-3 gap-0.5">
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.href ||
              (item.href !== "/" && location.pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={onClose}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[14px] transition-colors
                  ${isActive
                    ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-medium"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900"
                  }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* 다크모드 토글 */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={toggle}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[14px] text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
          >
            {dark ? <SunIcon /> : <MoonIcon />}
            {dark ? "라이트 모드" : "다크 모드"}
          </button>
        </div>
      </aside>
    </>
  );
}
