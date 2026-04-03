"use client";

import { useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { ClusterRow, Bias } from "@/types";
import { FeedCard } from "./FeedCard";
import { usePersonalization } from "@/lib/usePersonalization";

const BIAS_PRIORITY: Bias[] = ["center", "left", "right"];

/**
 * Alege articolul „reprezentativ" dintr-un cluster pentru feed:
 * preferă centru → stânga → dreapta.
 */
function pickRepresentative(row: ClusterRow) {
  for (const b of BIAS_PRIORITY) {
    if (row[b]) return row[b]!;
  }
  return null;
}

interface Props {
  rows: ClusterRow[];
}

export function DiscoveryFeed({ rows }: Props) {
  const { sortRows, recordClick, hasPersonalization } = usePersonalization();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Sortare personalizată (stabilă — useMemo)
  const orderedRows = useMemo(() => sortRows(rows), [rows, sortRows]);

  function handleToggle(clusterId: string) {
    const next = expandedId === clusterId ? null : clusterId;
    setExpandedId(next);
    if (next) recordClick(clusterId);
  }

  return (
    <div className="space-y-3">
      {/* Banner personalizare */}
      <AnimatePresence>
        {hasPersonalization && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800"
          >
            <Sparkles size={13} className="text-purple-500 fill-purple-500 shrink-0" />
            <p className="text-[11px] text-purple-700 dark:text-purple-300">
              Feed personalizat după interesele tale. Subiectele accesate recent apar primele.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista de carduri */}
      <AnimatePresence mode="popLayout">
        {orderedRows.map((row, index) => {
          const article = pickRepresentative(row);
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
