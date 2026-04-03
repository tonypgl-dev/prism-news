"use client";

import * as Popover from "@radix-ui/react-popover";
import { ExternalLink, Building2, Landmark, ShieldCheck, Info } from "lucide-react";
import type { Source, Bias } from "@/types";
import { BIAS_COLORS } from "@/lib/utils";
import { useSettings } from "@/hooks/useSettings";

// ----------------------------------------------------------------
// Factuality score → eticheta descriptivă
// ----------------------------------------------------------------
function factualityLabel(score: number): { label: string; color: string } {
  if (score >= 85) return { label: "Înaltă", color: "text-green-600 dark:text-green-400" };
  if (score >= 65) return { label: "Medie-Înaltă", color: "text-lime-600 dark:text-lime-400" };
  if (score >= 45) return { label: "Medie", color: "text-yellow-600 dark:text-yellow-400" };
  return { label: "Scăzută", color: "text-red-600 dark:text-red-400" };
}

// ----------------------------------------------------------------
// Bara de factualitate vizuală (0–100)
// ----------------------------------------------------------------
function FactualityBar({ score }: { score: number }) {
  const { label, color } = factualityLabel(score);
  const pct = Math.max(0, Math.min(100, score));

  const barColor =
    pct >= 85 ? "#22c55e" :
    pct >= 65 ? "#84cc16" :
    pct >= 45 ? "#eab308" :
    "#ef4444";

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">
          Scor facticitate
        </span>
        <span className={`text-[10px] font-bold ${color}`}>
          {score}/100 · {label}
        </span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: barColor }}
        />
      </div>
    </div>
  );
}

// ----------------------------------------------------------------
// Componenta principală
// ----------------------------------------------------------------
interface Props {
  source: Source;
  /** Clasa CSS pentru trigger (butonul cu numele sursei) */
  triggerClassName?: string;
}

export function SourcePopover({ source, triggerClassName }: Props) {
  const { biasLabels } = useSettings();
  const colors = BIAS_COLORS[source.bias as Bias];
  const hasOwnershipData =
    source.owner || source.notable_interests || source.factuality_score != null;

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          className={`
            group inline-flex items-center gap-1.5 cursor-pointer
            focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500
            focus-visible:ring-offset-1 rounded
            ${triggerClassName ?? ""}
          `}
          aria-label={`Informații despre sursa ${source.name}`}
        >
          {/* Dot bias */}
          <span className={`w-2 h-2 rounded-full shrink-0 ${colors.dot}`} />
          {/* Nume sursă */}
          <span
            className={`
              text-xs font-semibold uppercase tracking-wide
              text-gray-500 dark:text-gray-400
              group-hover:${colors.text.replace("text-", "text-")}
              group-hover:underline decoration-dotted underline-offset-2
              transition-colors
            `}
          >
            {source.name}
          </span>
          {/* Iconiță discretă info */}
          <Info
            size={10}
            className="text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors"
          />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          side="top"
          align="start"
          sideOffset={8}
          className={`
            z-50 w-72 rounded-xl border shadow-xl
            bg-white dark:bg-gray-900
            border-gray-200 dark:border-gray-700
            p-4 space-y-3
            animate-in fade-in-0 zoom-in-95
            data-[side=bottom]:slide-in-from-top-2
            data-[side=top]:slide-in-from-bottom-2
          `}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${colors.dot}`}
              />
              <span className="font-bold text-sm text-gray-900 dark:text-white">
                {source.name}
              </span>
            </div>
            <span
              className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${colors.badge}`}
            >
              {biasLabels[source.bias as Bias]}
            </span>
          </div>

          {/* Separator */}
          <div className="border-t border-gray-100 dark:border-gray-800" />

          {hasOwnershipData ? (
            <div className="space-y-2.5">
              {/* Proprietar */}
              {source.owner && (
                <div className="flex gap-2">
                  <Building2
                    size={13}
                    className="text-gray-400 dark:text-gray-500 shrink-0 mt-0.5"
                  />
                  <div>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-0.5">
                      Proprietar
                    </p>
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {source.owner}
                    </p>
                  </div>
                </div>
              )}

              {/* Interese notabile */}
              {source.notable_interests && (
                <div className="flex gap-2">
                  <Landmark
                    size={13}
                    className="text-gray-400 dark:text-gray-500 shrink-0 mt-0.5"
                  />
                  <div>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-0.5">
                      Interese notabile
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {source.notable_interests}
                    </p>
                  </div>
                </div>
              )}

              {/* Scor facticitate */}
              {source.factuality_score != null && (
                <div className="flex gap-2">
                  <ShieldCheck
                    size={13}
                    className="text-gray-400 dark:text-gray-500 shrink-0 mt-0.5"
                  />
                  <div className="flex-1">
                    <FactualityBar score={source.factuality_score} />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-gray-400 dark:text-gray-500 italic">
              Nu avem date de transparență pentru această sursă momentan.
            </p>
          )}

          {/* Link profil complet */}
          {source.profile_url && (
            <>
              <div className="border-t border-gray-100 dark:border-gray-800" />
              <a
                href={source.profile_url}
                target="_blank"
                rel="noopener noreferrer"
                className={`
                  flex items-center gap-1.5 text-[11px] font-semibold
                  ${colors.text} hover:underline
                `}
              >
                <ExternalLink size={10} />
                Vezi profil complet sursă
              </a>
            </>
          )}

          {/* Arrow */}
          <Popover.Arrow className="fill-white dark:fill-gray-900 drop-shadow-sm" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
