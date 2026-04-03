"use client";

import { useState } from "react";
import type { ClusterRow, Bias } from "@/types";
import { useSettings } from "@/hooks/useSettings";

// ----------------------------------------------------------------
// Culori inline (nu Tailwind) pentru a putea seta width dinamic
// ----------------------------------------------------------------
const BAR_COLORS: Record<Bias, { bar: string; tooltip: string; label: string }> = {
  left:   { bar: "#93C5FD", tooltip: "bg-blue-600",  label: "text-blue-100"  },
  center: { bar: "#94A3B8", tooltip: "bg-slate-600", label: "text-slate-100" },
  right:  { bar: "#FCA5A5", tooltip: "bg-red-600",   label: "text-red-100"   },
};

const COLUMNS: Bias[] = ["left", "center", "right"];

// ----------------------------------------------------------------
// Calcul distribuție
// ----------------------------------------------------------------
interface BiasDistribution {
  left: number;   // 0–100
  center: number;
  right: number;
  total: number;
}

function calcDistribution(row: ClusterRow): BiasDistribution {
  const present = COLUMNS.filter((b) => row[b] !== null);
  const total = present.length;
  if (total === 0) return { left: 0, center: 0, right: 0, total: 0 };

  return {
    left:   row.left   ? Math.round((1 / total) * 100) : 0,
    center: row.center ? Math.round((1 / total) * 100) : 0,
    right:  row.right  ? Math.round((1 / total) * 100) : 0,
    total,
  };
}

// ----------------------------------------------------------------
// Componentă principală
// ----------------------------------------------------------------
interface Props {
  row: ClusterRow;
  /** Titlul subiectului (extras din primul articol disponibil) */
  storyTitle?: string;
}

export function StoryBiasBar({ row, storyTitle }: Props) {
  const { biasLabels } = useSettings();
  const [hovered, setHovered] = useState(false);
  const dist = calcDistribution(row);

  if (dist.total === 0) return null;

  // Construim segmentele vizibile (bias-uri prezente în cluster)
  const segments = COLUMNS.filter((b) => dist[b] > 0);

  // Legendă tooltip
  const tooltipParts = segments
    .map((b) => `${dist[b]}% ${biasLabels[b]}`)
    .join("  ·  ");

  // Label blindspot
  const missing = COLUMNS.filter((b) => row[b] === null);
  const blindspotLabel =
    missing.length > 0
      ? `Lipsă: ${missing.map((b) => biasLabels[b]).join(", ")}`
      : "Acoperire completă";

  return (
    <div
      className="relative mb-3"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* ── Bară subțire ─────────────────────────────────────────── */}
      <div
        className="flex w-full h-1.5 rounded-full overflow-hidden gap-px"
        aria-label={`Distribuție bias: ${tooltipParts}`}
        role="img"
      >
        {segments.map((bias) => (
          <div
            key={bias}
            style={{
              width: `${dist[bias]}%`,
              backgroundColor: BAR_COLORS[bias].bar,
              transition: "width 0.4s ease",
            }}
          />
        ))}
      </div>

      {/* ── Tooltip la hover ─────────────────────────────────────── */}
      <div
        className={`
          absolute left-0 top-4 z-20
          flex flex-col gap-1
          px-3 py-2 rounded-lg shadow-lg
          bg-gray-900 dark:bg-gray-800
          border border-gray-700
          pointer-events-none
          transition-all duration-150
          ${hovered ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"}
        `}
        style={{ minWidth: "220px" }}
      >
        {/* Titlu subiect */}
        {storyTitle && (
          <p className="text-[10px] text-gray-400 font-medium truncate max-w-xs">
            {storyTitle}
          </p>
        )}

        {/* Segmente colorate */}
        <div className="flex items-center gap-2 flex-wrap">
          {segments.map((bias) => (
            <span
              key={bias}
              className={`
                inline-flex items-center gap-1
                px-1.5 py-0.5 rounded text-[10px] font-bold
                ${BAR_COLORS[bias].tooltip} ${BAR_COLORS[bias].label}
              `}
            >
              <span
                className="inline-block w-1.5 h-1.5 rounded-full bg-white/40"
              />
              {dist[bias]}% {biasLabels[bias]}
            </span>
          ))}
        </div>

        {/* Blindspot info */}
        <p
          className={`text-[10px] ${
            missing.length > 0
              ? "text-amber-400"
              : "text-green-400"
          }`}
        >
          {missing.length > 0 ? "⚠ " : "✓ "}
          {blindspotLabel}
        </p>
      </div>
    </div>
  );
}
