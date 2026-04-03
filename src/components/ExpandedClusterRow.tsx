"use client";

import { motion } from "framer-motion";
import type { ClusterRow, Bias } from "@/types";
import { NewsCard, NewsCardBlindspot } from "./NewsCard";
import { StoryBiasBar } from "./StoryBiasBar";
import { BlindspotBadge } from "./BlindspotBadge";
import { BIAS_COLORS } from "@/lib/utils";
import { useSettings } from "@/hooks/useSettings";
import { X } from "lucide-react";

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
      <div className="rounded-2xl border border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20 p-4 mt-1">

        {/* Header row: titlu + buton collapse */}
        <div className="flex items-center justify-between mb-3 gap-2">
          <span className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-widest">
            ✨ Trei Perspective
          </span>
          <button
            onClick={onCollapse}
            aria-label="Închide perspectivele"
            className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X size={13} />
            Restrânge
          </button>
        </div>

        {/* Blindspot + Prism bar */}
        <BlindspotBadge row={row} />
        <div className="mb-3">
          <StoryBiasBar
            row={row}
            storyTitle={(row.left ?? row.center ?? row.right)?.title}
          />
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          {COLUMNS.map((bias) => {
            const c = BIAS_COLORS[bias];
            return (
              <div
                key={bias}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${c.border} ${c.bg}`}
              >
                <div className={`w-2 h-2 rounded-full ${c.dot}`} />
                <span className={`text-[11px] font-bold uppercase tracking-widest ${c.text}`}>
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
