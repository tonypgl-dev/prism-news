"use client";

import { Info } from "lucide-react";
import { BIAS_COLORS } from "@/lib/utils";
import type { Bias } from "@/types";
import { useSettings } from "@/hooks/useSettings";

const BIASES: Bias[] = ["left", "center", "right"];

export function BiasLegend() {
  const { biasLabels } = useSettings();
  return (
    <div className="flex flex-wrap items-center gap-4 px-4 py-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
        <Info size={12} />
        <span className="font-medium">Spectrul editorial:</span>
      </div>
      <div className="flex items-center gap-4">
        {BIASES.map((bias) => {
          const c = BIAS_COLORS[bias];
          return (
            <div key={bias} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${c.dot}`} />
              <span className={`text-xs font-semibold ${c.text}`}>{biasLabels[bias]}</span>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500 ml-auto hidden sm:block">
        Spațiile goale indică un <strong>blindspot</strong> editorial
      </p>
    </div>
  );
}
