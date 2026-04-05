"use client";

import { useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { ClusterRow, Bias } from "@/types";
import { FeedCard } from "./FeedCard";
import { usePersonalization } from "@/lib/usePersonalization";
import type { BiasFilter } from "./SpectrumSection";
import type { SortOrder } from "./SortOrderDropdown";

const BIAS_PRIORITY: Bias[] = ["center", "left", "right"];

function pickRepresentative(row: ClusterRow, biasFilter: BiasFilter) {
  if (biasFilter !== "all" && row[biasFilter]) return row[biasFilter]!;
  for (const b of BIAS_PRIORITY) {
    if (row[b]) return row[b]!;
  }
  return null;
}

interface Props {
  rows: ClusterRow[];
  biasFilter?: BiasFilter;
  /** Doar la „recent” aplicăm sortarea după click-uri; altfel păstrăm ordinea din părinte (populare / recomandate). */
  sortOrder?: SortOrder;
}

export function DiscoveryFeed({ rows, biasFilter = "all", sortOrder = "recent" }: Props) {
  const { sortRows, recordClick, hasPersonalization } = usePersonalization();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Sortare personalizată doar pentru „recent”; altfel rămâne ordinea deja calculată în NewsPageClient
  const orderedRows = useMemo(() => {
    const sorted =
      sortOrder === "recent" ? sortRows(rows) : [...rows];
    const seen = new Set<string>();
    return sorted.filter((row) => {
      if (seen.has(row.cluster_id)) return false;
      seen.add(row.cluster_id);
      return true;
    });
  }, [rows, sortRows, sortOrder]);

  function handleToggle(clusterId: string) {
    const next = expandedId === clusterId ? null : clusterId;
    setExpandedId(next);
    if (next) recordClick(clusterId);
  }

  return (
    <div className="space-y-3">
      {/* Banner personalizare */}
      <AnimatePresence>
        {hasPersonalization && sortOrder === "recent" && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex items-center gap-2 px-3 py-2 rounded-sm bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
          >
            <Sparkles size={12} className="text-slate-900 dark:text-white shrink-0" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">
              Personalized Feed · Based on your recent activity
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista de carduri */}
      <AnimatePresence mode="popLayout">
        {orderedRows.map((row, index) => {
          const article = pickRepresentative(row, biasFilter);
          if (!article) return null;

          return (
            <FeedCard
              key={row.cluster_id}
              article={article}
              row={row}
              index={index}
              isExpanded={expandedId === row.cluster_id}
              onToggle={() => handleToggle(row.cluster_id)}
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
}
