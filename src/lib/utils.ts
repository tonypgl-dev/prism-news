import type { Bias, ClusterRow } from "@/types";

export function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "acum câteva secunde";
  if (minutes < 60) return `acum ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `acum ${hours} ${hours === 1 ? "oră" : "ore"}`;
  const days = Math.floor(hours / 24);
  return `acum ${days} ${days === 1 ? "zi" : "zile"}`;
}

export const BIAS_LABELS: Record<Bias, string> = {
  left: "Stânga",
  center: "Centru",
  right: "Dreapta",
};

// ----------------------------------------------------------------
// Blindspot detection
// ----------------------------------------------------------------

export type BlindspotInfo =
  | { type: "none" }
  | { type: "partial"; missing: Bias[]; present: Bias[] }
  | { type: "single"; only: Bias; missing: Bias[] };

const ALL_BIASES: Bias[] = ["left", "center", "right"];

/**
 * Determină tipul de blindspot al unui cluster:
 * - "none"    → toate 3 perspectivele sunt prezente
 * - "partial" → lipsesc 1-2 perspective (cel mai frecvent caz)
 * - "single"  → doar o perspectivă acoperă subiectul (blindspot maxim)
 */
export function getBlindspot(row: ClusterRow): BlindspotInfo {
  const present = ALL_BIASES.filter((b) => row[b] !== null);
  const missing = ALL_BIASES.filter((b) => row[b] === null);

  if (missing.length === 0) return { type: "none" };
  if (present.length === 1) return { type: "single", only: present[0], missing };
  return { type: "partial", missing, present };
}

/**
 * Returnează true dacă un cluster este considerat blindspot
 * (lipsește cel puțin o perspectivă).
 */
export function isBlindspot(row: ClusterRow): boolean {
  return getBlindspot(row).type !== "none";
}

export const BIAS_COLORS: Record<
  Bias,
  { bg: string; border: string; badge: string; text: string; dot: string }
> = {
  left: {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800",
    badge: "bg-blue-600 text-white",
    text: "text-blue-700 dark:text-blue-400",
    dot: "bg-blue-500",
  },
  center: {
    bg: "bg-slate-50 dark:bg-slate-950/30",
    border: "border-slate-200 dark:border-slate-700",
    badge: "bg-slate-500 text-white",
    text: "text-slate-600 dark:text-slate-400",
    dot: "bg-slate-400",
  },
  right: {
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-200 dark:border-red-800",
    badge: "bg-red-600 text-white",
    text: "text-red-700 dark:text-red-400",
    dot: "bg-red-500",
  },
};
