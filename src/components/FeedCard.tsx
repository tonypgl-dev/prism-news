"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Clock, ImageOff, Lock, Zap, Newspaper } from "lucide-react";
import type { Article, ClusterRow, Bias } from "@/types";
import { timeAgo, BIAS_COLORS } from "@/lib/utils";
import { useSettings } from "@/hooks/useSettings";
import { useFreemium } from "@/hooks/useFreemium";
import { SourcePopover } from "./SourcePopover";
import { ExpandedClusterRow } from "./ExpandedClusterRow";

function siblingCount(row: ClusterRow, mainBias: Bias): number {
  const biases: Bias[] = ["left", "center", "right"];
  return biases.filter((b) => b !== mainBias && row[b] !== null).length;
}

const DOT_COLORS: Record<Bias, string> = {
  left:   "bg-blue-500",
  center: "bg-slate-400",
  right:  "bg-red-500",
};

function buildHaloGradient(row: ClusterRow): string {
  const colors: Record<Bias, string> = {
    left:   "#3B82F6",
    center: "#94A3B8",
    right:  "#EF4444",
  };
  const present = (["left", "center", "right"] as Bias[]).filter((b) => row[b] !== null);
  if (present.length === 0) return "transparent";
  if (present.length === 1) return colors[present[0]];
  const step = 100 / present.length;
  const segments: string[] = [];
  present.forEach((b, i) => {
    segments.push(`${colors[b]} ${i * step}%`);
    segments.push(`${colors[b]} ${(i + 1) * step}%`);
  });
  return `linear-gradient(to right, ${segments.join(", ")})`;
}

interface Props {
  article: Article;
  row: ClusterRow;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}

export function FeedCard({ article, row, index, isExpanded, onToggle }: Props) {
  const { biasLabels, settings } = useSettings();
  const { showBiasLabels, titleFont, showAiPreSummary } = settings;
  const { isPremium } = useFreemium();
  const colors = BIAS_COLORS[article.bias];
  const siblings = siblingCount(row, article.bias);
  const hasCluster = siblings > 0;
  const haloGradient = buildHaloGradient(row);

  const hasAiContent = Boolean(article.ai_pre_summary || article.ai_summary || article.original_snippet);
  const isCardExpandable = hasAiContent;

  const titleClass = titleFont === "serif"
    ? "font-[family-name:var(--font-playfair)] text-base sm:text-lg font-bold leading-snug text-gray-900 dark:text-white line-clamp-2 group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors"
    : "font-sans text-sm font-bold leading-snug text-gray-900 dark:text-white line-clamp-2 group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.4), ease: "easeOut" }}
    >
      {/* ── Card principal ────────────────────────────────────────── */}
      <motion.article
        layout
        className={`
          relative flex flex-col rounded-xl border overflow-hidden
          bg-white dark:bg-gray-900
          ${colors.border}
          shadow-sm hover:shadow-md transition-shadow duration-200
          ${isExpanded ? "ring-2 ring-purple-400 dark:ring-purple-600" : ""}
        `}
      >
        {/* ── Row superior: thumbnail + body ──────────────────────── */}
        <div className="flex gap-4">
          {/* Thumbnail */}
          <a
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            tabIndex={-1}
            aria-hidden="true"
            className="relative shrink-0 w-32 sm:w-44 bg-gray-100 dark:bg-gray-800 overflow-hidden"
          >
            {article.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={article.image_url}
                alt={article.title}
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full min-h-[96px] flex items-center justify-center">
                <ImageOff size={22} className="text-gray-300 dark:text-gray-600" />
              </div>
            )}
            {showBiasLabels && (
              <span
                className={`absolute top-2 left-2 text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full ${colors.badge}`}
              >
                {biasLabels[article.bias]}
              </span>
            )}
          </a>

          {/* Body */}
          <div className="flex flex-col flex-1 py-3 pr-3 gap-2 min-w-0">
            {/* Source + Dot Trio */}
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                {article.source ? (
                  <SourcePopover source={article.source} />
                ) : (
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${colors.dot}`} />
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                      Sursă necunoscută
                    </span>
                  </div>
                )}
              </div>

              {/* Bias Dot Trio */}
              <div className="flex items-center gap-1 shrink-0">
                {hasCluster ? (
                  <button
                    onClick={onToggle}
                    aria-expanded={isExpanded}
                    aria-label={`Vezi ${siblings + 1} perspective`}
                    className="flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded-sm"
                  >
                    <div className={`flex gap-0.5 ${isExpanded ? "opacity-100" : "opacity-70"}`}>
                      {(["left", "center", "right"] as Bias[]).map((b) => (
                        <div
                          key={b}
                          className={`w-2 h-2 rounded-full ${
                            row[b] !== null ? DOT_COLORS[b] : "bg-gray-200 dark:bg-gray-700"
                          }`}
                        />
                      ))}
                    </div>
                    {!isPremium && (
                      <Lock size={9} className="text-violet-400 ml-0.5" />
                    )}
                  </button>
                ) : (
                  <div className="flex gap-0.5 opacity-30">
                    {(["left", "center", "right"] as Bias[]).map((b) => (
                      <div
                        key={b}
                        className={`w-2 h-2 rounded-full ${
                          row[b] !== null ? DOT_COLORS[b] : "bg-gray-200 dark:bg-gray-700"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Title — click expandează conținutul AI */}
            <button
              className="group text-left"
              onClick={isCardExpandable ? onToggle : undefined}
              aria-expanded={isCardExpandable ? isExpanded : undefined}
            >
              <h3 className={titleClass}>
                {article.title}
              </h3>
            </button>

            {/* Footer */}
            <div className="flex items-center justify-between mt-auto pt-1 flex-wrap gap-2">
              <div className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500">
                <Clock size={10} />
                <span suppressHydrationWarning>{timeAgo(article.published_at)}</span>
                {isCardExpandable && (
                  <span className="ml-1.5 text-[10px] text-purple-500 dark:text-purple-400 font-semibold">
                    {isExpanded ? "▲ Restrânge" : "▼ Sinteză AI"}
                  </span>
                )}
              </div>

              <a
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-1 text-[11px] font-semibold ${colors.text} hover:underline`}
              >
                Sursă
                <ExternalLink size={10} />
              </a>
            </div>
          </div>
        </div>

        {/* ── Cele 3 straturi expandabile ─────────────────────────── */}
        <AnimatePresence initial={false}>
          {isExpanded && isCardExpandable && (
            <motion.div
              key="ai-layers"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 pt-1 flex flex-col gap-3 border-t border-gray-100 dark:border-gray-800">

                {/* Strat 1 — The Hook (ai_pre_summary) */}
                {showAiPreSummary && article.ai_pre_summary && (
                  <div className="flex items-start gap-2">
                    <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 mt-0.5">
                      <Zap size={8} className="fill-purple-600 dark:fill-purple-400" />
                      Sinteză Rapidă
                    </span>
                    <p className="text-sm font-bold text-gray-900 dark:text-white leading-snug">
                      {article.ai_pre_summary}
                    </p>
                  </div>
                )}

                {/* Strat 2 — The Context (ai_summary) */}
                {article.ai_summary && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                    {article.ai_summary}
                  </p>
                )}

                {/* Strat 3 — The Source Proof (original_snippet) */}
                {article.original_snippet && (
                  <div className="relative rounded-lg border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 px-3 py-2.5 shadow-inner">
                    <span className="absolute -top-2 left-3 inline-flex items-center gap-1 bg-white dark:bg-gray-900 px-1.5 text-[9px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                      <Newspaper size={8} />
                      Fragment original · {article.source?.name ?? "Sursă"}
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed italic mt-1">
                      &ldquo;{article.original_snippet}&rdquo;
                    </p>
                  </div>
                )}

                {/* CTA Final */}
                <a
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`
                    self-start inline-flex items-center gap-1.5
                    px-3 py-1.5 rounded-lg text-xs font-bold
                    border transition-all duration-200
                    ${colors.badge} border-transparent
                    hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500
                  `}
                >
                  Citește restul articolului pe {article.source?.name ?? "sursă"} →
                  <ExternalLink size={10} />
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Prism Halo ──────────────────────────────────────────── */}
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 right-0 h-[3px] pointer-events-none"
          style={{ background: haloGradient }}
        />
      </motion.article>

      {/* ── Expansion panel cluster (perspective multiple) ──────── */}
      <AnimatePresence>
        {isExpanded && hasCluster && (
          <ExpandedClusterRow row={row} onCollapse={onToggle} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
