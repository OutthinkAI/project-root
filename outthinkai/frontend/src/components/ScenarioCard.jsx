import React from "react";

export default function ScenarioCard({ scenarioData, onConfirm }) {
  if (!scenarioData) return null;

  const { scenario, agent_a, agent_b } = scenarioData;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="relative p-8 bg-black border border-[#00ffaa]/30 shadow-[0_0_30px_rgba(0,255,170,0.1)]">
        <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-[#00ffaa]" />
        <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-[#00ffaa]" />
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-[#00ffaa]" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-[#00ffaa]" />

        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[12px] text-[#00ffaa] border border-[#00ffaa]/30 px-2 py-1 uppercase tracking-widest">
              Scenario Brief
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-[#00ffaa]/30 to-transparent" />
          </div>

          <p className="font-sans text-[16px] leading-relaxed text-white/90 whitespace-pre-wrap">
            {scenario}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {/* Agent A */}
            <div className="p-5 bg-white/[0.03] border border-white/10 group hover:border-[#00ffaa]/40 transition-colors">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 bg-[#00ffaa]" />
                <span className="font-mono text-[10px] text-white/40 uppercase tracking-wider">Agent Alpha</span>
              </div>
              <h4 className="font-grotesk text-[18px] font-bold text-white mb-2">{agent_a.name}</h4>
              <p className="font-mono text-[12px] text-white/50 mb-4 leading-normal italic">"{agent_a.persona}"</p>
              <div className="pt-3 border-t border-white/5">
                <span className="font-mono text-[9px] text-[#00ffaa] uppercase block mb-1">Initial Claim</span>
                <p className="font-sans text-[13px] text-white/80">{agent_a.initial_claim}</p>
              </div>
            </div>

            {/* Agent B */}
            <div className="p-5 bg-white/[0.03] border border-white/10 group hover:border-[#ff00aa]/40 transition-colors">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 bg-[#ff00aa]" />
                <span className="font-mono text-[10px] text-white/40 uppercase tracking-wider">Agent Bravo</span>
              </div>
              <h4 className="font-grotesk text-[18px] font-bold text-white mb-2">{agent_b.name}</h4>
              <p className="font-mono text-[12px] text-white/50 mb-4 leading-normal italic">"{agent_b.persona}"</p>
              <div className="pt-3 border-t border-white/5">
                <span className="font-mono text-[9px] text-[#ff00aa] uppercase block mb-1">Initial Claim</span>
                <p className="font-sans text-[13px] text-white/80">{agent_b.initial_claim}</p>
              </div>
            </div>
          </div>

          <button
            onClick={onConfirm}
            className="mt-4 w-full h-[60px] bg-[#00ffaa] text-black font-bold font-mono text-[16px] uppercase hover:bg-white transition-all shadow-[0_0_20px_rgba(0,255,170,0.2)]"
          >
            Enter Simulation Room →
          </button>
        </div>
      </div>
    </div>
  );
}
