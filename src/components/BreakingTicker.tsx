"use client";

import { Zap } from "lucide-react";

interface Props {
  items: string[];
}

export function BreakingTicker({ items }: Props) {
  return (
    <div className="w-full bg-red-600 text-white text-xs font-semibold overflow-hidden">
      <div className="flex items-center max-w-screen-xl mx-auto">
        {/* Label fix */}
        <div className="flex items-center gap-1.5 px-3 py-2 bg-red-700 shrink-0 z-10">
          <Zap size={12} className="fill-white" />
          <span className="uppercase tracking-widest text-[10px]">Live</span>
        </div>
        {/* Scrolling items */}
        <div className="relative flex-1 overflow-hidden py-2">
          <div className="ticker-inner inline-flex gap-16">
            {[...items, ...items].map((item, i) => (
              <span key={i} className="inline-flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-red-300 inline-block" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
