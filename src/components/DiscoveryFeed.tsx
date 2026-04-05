"use client";

import { useState, useMemo } from "react";
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
  sortOrder?: SortOrder;
}

export function DiscoveryFeed({ rows, biasFilter = "all", sortOrder = "recent" }: Props) {
  const { sortRows, recordClick } = usePersonalization();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const orderedRows = useMemo(() => {
    const sorted = sortOrder === "recent" ? sortRows(rows) : [...rows];
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
    </div>
  );
}
