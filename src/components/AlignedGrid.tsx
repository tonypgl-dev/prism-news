"use client";

import { useState } from "react";
import type { ClusterRow, Bias } from "@/types";
import { NewsCard, NewsCardBlindspot } from "./NewsCard";
import { StoryBiasBar } from "./StoryBiasBar";
import { BlindspotBadge } from "./BlindspotBadge";
import { BIAS_COLORS } from "@/lib/utils";
import { useSettings } from "@/hooks/useSettings";

const COLUMNS: Bias[] = ["left", "center", "right"];

interface Props {
  rows: ClusterRow[];
}

/** Extrage titlul reprezentativ al unui cluster (primul articol disponibil). */
function clusterTitle(row: ClusterRow): string | undefined {
  return (row.left ?? row.center ?? row.right)?.title;
}

/* ----------------------------------------------------------------
   Desktop: 3-column aligned grid
---------------------------------------------------------------- */
function DesktopGrid({ rows }: Props) {
  const { biasLabels } = useSettings();
  return (
    <div className="hidden md:block">
      {/* Column headers */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        {COLUMNS.map((bias) => {
          const c = BIAS_COLORS[bias];
          return (
            <div
              key={bias}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border ${c.border} ${c.bg}`}
            >
              <div className={`w-2.5 h-2.5 rounded-full ${c.dot}`} />
              <span className={`text-xs font-bold uppercase tracking-widest ${c.text}`}>
                {biasLabels[bias]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Cluster rows */}
      <div className="flex flex-col gap-8">
        {rows.map((row, rowIdx) => (
          <div key={row.cluster_id}>
            {/* Blindspot badge */}
            <BlindspotBadge row={row} />

            {/* Prism Bar */}
            <div className="px-0.5 mb-1">
              <StoryBiasBar row={row} storyTitle={clusterTitle(row)} />
            </div>

            <div className="grid grid-cols-3 gap-4 items-start">
              {COLUMNS.map((bias) => {
                const article = row[bias];
                return article ? (
                  <NewsCard
                    key={article.id}
                    article={article}
                    index={rowIdx * 3 + COLUMNS.indexOf(bias)}
                  />
                ) : (
                  <NewsCardBlindspot key={`empty-${bias}`} bias={bias} />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------
   Mobile: tab-based view
---------------------------------------------------------------- */
function MobileGrid({ rows }: Props) {
  const { biasLabels } = useSettings();
  const [activeTab, setActiveTab] = useState<Bias>("center");

  return (
    <div className="md:hidden">
      {/* Tabs */}
      <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 mb-4 bg-gray-100 dark:bg-gray-800 p-1 gap-1">
        {COLUMNS.map((bias) => {
          const c = BIAS_COLORS[bias];
          const isActive = activeTab === bias;
          return (
            <button
              key={bias}
              onClick={() => setActiveTab(bias)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all duration-200 ${
                isActive
                  ? `${c.badge} shadow-sm`
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isActive ? "bg-white/80" : c.dot
                }`}
              />
              {biasLabels[bias]}
            </button>
          );
        })}
      </div>

      {/* Cards for active tab */}
      <div className="flex flex-col gap-5">
        {rows.map((row, idx) => {
          const article = row[activeTab];
          return (
            <div key={row.cluster_id}>
              <BlindspotBadge row={row} />
              <StoryBiasBar row={row} storyTitle={clusterTitle(row)} />
              {article ? (
                <NewsCard article={article} index={idx} />
              ) : (
                <NewsCardBlindspot bias={activeTab} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------
   Main export
---------------------------------------------------------------- */
export function AlignedGrid({ rows }: Props) {
  return (
    <section>
      <DesktopGrid rows={rows} />
      <MobileGrid rows={rows} />
    </section>
  );
}
