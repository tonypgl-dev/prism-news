"use client";

import { motion } from "framer-motion";
import type { ClusterRow, Bias } from "@/types";
import { NewsCard, NewsCardBlindspot } from "./NewsCard";
import { StoryBiasBar } from "./StoryBiasBar";
import { BlindspotBadge } from "./BlindspotBadge";
import { BIAS_COLORS } from "@/lib/utils";
import { useSettings } from "@/hooks/useSettings";
import { Sparkles, X } from "lucide-react";

const COLUMNS: Bias[] = ["left", "center", "right"];

interface Props {
  row: ClusterRow;
  onCollapse: () => void;
}

export function ExpandedClusterRow({ row, onCollapse }: Props) {
  const { biasLabels } = useSettings();
  return (
    <motion.div
      key="expanded"
      initial={{ opacity: 0, height: 0, y: -8 }}
      animate={{ opacity: 1, height: "auto", y: 0 }}
      exit={{ opacity: 0, height: 0, y: -8 }}
      transition={{ duration: 0.38, ease: [0.4, 0, 0.2, 1] }}
      className="overflow-hidden"
    >
      <div className="rounded-sm border border-gray-200 dark:border-gray-800 bg-slate-50 dark:bg-gray-950 p-4 mt-2">

        {/* Header row: titlu + buton collapse */}
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Sparkles size={12} className="text-slate-900 dark:text-white" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">
              Full Spectrum Perspective
            </span>
          </div>
          <button
            onClick={onCollapse}
            className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1"
          >
            <X size={12} />
            Close
          </button>
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {COLUMNS.map((bias) => {
            const c = BIAS_COLORS[bias];
            return (
              <div
                key={bias}
                className="flex items-center gap-3 px-3 py-2 rounded-sm border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900"
              >
                <div className="w-1 h-3 shrink-0" style={{ backgroundColor: c.hex }} />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">
                  {biasLabels[bias]}
                </span>
              </div>
            );
          })}
        </div>

        {/* 3-column grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {COLUMNS.map((bias, i) => {
            const article = row[bias];
            return article ? (
              <NewsCard key={article.id} article={article} index={i} />
            ) : (
              <NewsCardBlindspot key={`empty-${bias}`} bias={bias} />
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
