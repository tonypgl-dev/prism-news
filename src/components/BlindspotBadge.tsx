"use client";

import { AlertTriangle, Eye } from "lucide-react";
import type { ClusterRow } from "@/types";
import { getBlindspot, BIAS_COLORS } from "@/lib/utils";
import { useSettings } from "@/hooks/useSettings";

interface Props {
  row: ClusterRow;
}

export function BlindspotBadge({ row }: Props) {
  const { biasLabels } = useSettings();
  const info = getBlindspot(row);

  if (info.type === "none") return null;

  // ── Single-source blindspot (maxim): o singură perspectivă ────
  if (info.type === "single") {
    const c = BIAS_COLORS[info.only];
    return (
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold
                     bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300
                     border border-amber-300 dark:border-amber-700"
          title={`Subiect acoperit exclusiv de presa de ${biasLabels[info.only]}`}
        >
          <AlertTriangle size={11} className="shrink-0" />
          Blindspot maxim
        </span>

        <span className="text-[11px] text-gray-500 dark:text-gray-400">
          Acoperit exclusiv de
        </span>

        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${c.badge}`}
        >
          <Eye size={10} />
          {biasLabels[info.only]}
        </span>

        <span className="text-[11px] text-gray-400 dark:text-gray-500">
          · lipsă:{" "}
          {info.missing.map((b) => biasLabels[b]).join(", ")}
        </span>
      </div>
    );
  }

  // ── Partial blindspot: lipsesc 1-2 perspective ────────────────
  return (
    <div className="flex items-center gap-2 mb-2 flex-wrap">
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold
                   bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400
                   border border-amber-200 dark:border-amber-800"
      >
        <AlertTriangle size={11} className="shrink-0" />
        Unghi mort
      </span>

      <span className="text-[11px] text-gray-500 dark:text-gray-400">
        Lipsesc perspectivele:
      </span>

      {info.missing.map((b) => {
        const c = BIAS_COLORS[b];
        return (
          <span
            key={b}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${c.badge} opacity-70`}
          >
            {biasLabels[b]}
          </span>
        );
      })}
    </div>
  );
}
