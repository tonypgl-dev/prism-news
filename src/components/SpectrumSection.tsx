"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BiasLegend } from "./BiasLegend";
import { NewsPageClient } from "./NewsPageClient";
import type { ClusterRow } from "@/types";

export type BiasFilter = "all" | "left" | "center" | "right";

interface Props {
  rows: ClusterRow[];
  totalArticles: number;
  initialFrom: string;
}

function SpectrumOrb({ onClick, isOpen }: { onClick: () => void; isOpen: boolean }) {
  return (
    <button
      onClick={onClick}
      aria-expanded={isOpen}
      className={`
        flex items-center gap-2 px-2 py-1.5 rounded-sm border transition-all duration-200
        ${isOpen 
          ? "bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-slate-900" 
          : "bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        }
      `}
      title="Editorial Spectrum"
    >
      <div className="flex gap-0.5 h-3 items-center">
        <div className="w-1 h-full bg-blue-600" />
        <div className="w-1 h-full bg-slate-500" />
        <div className="w-1 h-full bg-red-600" />
      </div>
      <span className="text-[10px] font-black uppercase tracking-widest">Spectrum</span>
    </button>
  );
}

export function SpectrumSection({ rows, totalArticles, initialFrom }: Props) {
  const [biasFilter, setBiasFilter] = useState<BiasFilter>("all");
  const [legendOpen, setLegendOpen] = useState(false);

  const orb = (
    <SpectrumOrb onClick={() => setLegendOpen((v) => !v)} isOpen={legendOpen} />
  );

  return (
    <>
      {/* Card spectru — expandabil */}
      <AnimatePresence>
        {legendOpen && (
          <motion.div
            key="bias-legend"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <BiasLegend biasFilter={biasFilter} onBiasFilterChange={setBiasFilter} />
          </motion.div>
        )}
      </AnimatePresence>

      <NewsPageClient
        rows={rows}
        totalArticles={totalArticles}
        initialFrom={initialFrom}
        biasFilter={biasFilter}
        toolbarPrefix={orb}
      />
    </>
  );
}
