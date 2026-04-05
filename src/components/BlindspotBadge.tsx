"use client";

import { AlertTriangle, Eye } from "lucide-react";
import type { ClusterRow } from "@/types";
import { getBlindspot, BIAS_COLORS } from "@/lib/utils";
import { useSettings } from "@/hooks/useSettings";

interface Props {
  row: ClusterRow;
}

export function BlindspotBadge({ row }: Props) {
  const { biasLabels, settings } = useSettings();
  const info = getBlindspot(row);

  if (!settings.showBlindspots) return null;
  if (info.type === "none") return null;

  // ── Single-source blindspot (maxim): o singură perspectivă ────
  if (info.type === "single") {
    const c = BIAS_COLORS[info.only];
    return (
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span
          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-sm text-[10px] font-black uppercase tracking-widest
                     bg-slate-900 dark:bg-white text-white dark:text-slate-900 border border-slate-900 dark:border-white"
          title={`Subiect acoperit exclusiv de presa de ${biasLabels[info.only]}`}
        >
          <AlertTriangle size={10} className="shrink-0" />
          Critical Blindspot
        </span>

        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Covered exclusively by
        </span>

        <span
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[10px] font-black uppercase tracking-widest border border-gray-200 dark:border-gray-800"
        >
          <div className="w-1 h-3" style={{ backgroundColor: c.hex }} />
          {biasLabels[info.only]}
        </span>
      </div>
    );
  }

  // ── Partial blindspot: lipsesc 1-2 perspective ────────────────
  return (
    <div className="flex items-center gap-2 mb-3 flex-wrap">
      <span
        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-sm text-[10px] font-black uppercase tracking-widest
                   bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
      >
        <AlertTriangle size={10} className="shrink-0" />
        Partial Coverage
      </span>

      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
        Missing perspective:
      </span>

      {info.missing.map((b) => {
        const c = BIAS_COLORS[b];
        return (
          <span
            key={b}
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[10px] font-black uppercase tracking-widest border border-gray-100 dark:border-gray-800 opacity-60"
          >
            <div className="w-1 h-3 bg-slate-300 dark:bg-slate-700" />
            {biasLabels[b]}
          </span>
        );
      })}
    </div>
  );
}
