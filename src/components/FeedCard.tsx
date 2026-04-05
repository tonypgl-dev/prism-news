"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Clock, ImageOff, Lock, Zap, Newspaper, Bell, X, Link2, Check } from "lucide-react";
import type { Article, ClusterRow, Bias } from "@/types";
import { timeAgo, BIAS_COLORS, titleToFeaturedSlug } from "@/lib/utils";
import { useSettings } from "@/hooks/useSettings";
import { useFreemium } from "@/hooks/useFreemium";
import { SourcePopover } from "./SourcePopover";
import { ExpandedClusterRow } from "./ExpandedClusterRow";

const BIAS_ORDER: Bias[] = ["left", "center", "right"];

function siblingCount(row: ClusterRow, mainBias: Bias): number {
  return BIAS_ORDER.filter((b) => b !== mainBias && row[b] !== null).length;
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
  const present = BIAS_ORDER.filter((b) => row[b] !== null);
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

  // ── Swipe-to-switch perspective ───────────────────────────────────
  const [activeBias, setActiveBias] = useState<Bias>(article.bias);
  const [swipeDir, setSwipeDir] = useState<1 | -1>(1);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const available = BIAS_ORDER.filter((b) => row[b] !== null);
  const activeArticle = (row[activeBias] ?? article) as Article;
  const currentIdx = available.indexOf(activeBias);
  const canSwipeLeft  = currentIdx < available.length - 1;
  const canSwipeRight = currentIdx > 0;

  function switchTo(bias: Bias) {
    const nextIdx = BIAS_ORDER.indexOf(bias);
    const curIdx  = BIAS_ORDER.indexOf(activeBias);
    setSwipeDir(nextIdx > curIdx ? 1 : -1);
    setActiveBias(bias);
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;

    // Ignore if too short or more vertical than horizontal
    if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy) * 1.2) return;

    if (dx < 0 && canSwipeLeft) {
      switchTo(available[currentIdx + 1]);
    } else if (dx > 0 && canSwipeRight) {
      switchTo(available[currentIdx - 1]);
    }
  }
  // ─────────────────────────────────────────────────────────────────

  const articleRef = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);

  function handleCopyLink(e: React.MouseEvent) {
    e.stopPropagation();
    const slug = titleToFeaturedSlug(activeArticle.title);
    const url = `${window.location.origin}/?featured=${slug}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const colors = BIAS_COLORS[activeBias];
  const siblings = siblingCount(row, article.bias);
  const hasCluster = siblings > 0;
  const haloGradient = buildHaloGradient(row);

  const hasAiSummary = Boolean(activeArticle.ai_pre_summary || activeArticle.ai_summary);
  const hasAiContent = hasAiSummary || Boolean(activeArticle.original_snippet);
  const isCardExpandable = hasAiContent;

  return (
    <div>
      {/* ── Card principal ──────────────────────────────────────────── */}
      <article
        ref={articleRef}
        onClick={isCardExpandable ? onToggle : undefined}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`
          relative flex flex-col rounded-sm border overflow-hidden
          bg-[var(--card)] border-gray-200 dark:border-gray-800
          hover:border-slate-400 dark:hover:border-slate-600
          transition-colors duration-200
          ${isExpanded ? "ring-2 ring-slate-900 dark:ring-white" : ""}
          ${isCardExpandable ? "cursor-pointer" : ""}
        `}
      >
        {/* ── Row superior: thumbnail + body ──────────────────────── */}
        <div className="flex gap-4">
          {/* Thumbnail */}
          <div
            className="relative shrink-0 w-32 sm:w-44 bg-gray-100 dark:bg-gray-900 overflow-hidden border-r border-gray-100 dark:border-gray-800"
            onClick={(e) => {
              e.stopPropagation();
              if (isExpanded) {
                window.open(activeArticle.link, "_blank", "noopener,noreferrer");
              } else if (isCardExpandable) {
                onToggle();
              }
            }}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeBias}
                className="w-full h-full"
                initial={{ opacity: 0, x: swipeDir * 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -swipeDir * 30 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {activeArticle.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={activeArticle.image_url}
                    alt={activeArticle.title}
                    className="w-full h-full object-cover grayscale-[0.2] hover:grayscale-0 transition-all duration-500 hover:scale-105 pointer-events-none"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full min-h-[96px] flex items-center justify-center pointer-events-none">
                    <ImageOff size={22} className="text-gray-300 dark:text-gray-700" />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Sursă + link extern — doar card deschis */}
            {isExpanded && (
              <a
                href={activeArticle.link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className={`
                  absolute z-[5] left-1 flex max-w-[min(calc(100%-0.5rem),9rem)] items-center gap-0.5 rounded-t-sm rounded-br-sm
                  bg-black/55 px-1 py-px text-[8px] font-medium leading-none text-white backdrop-blur-[2px]
                  transition-colors hover:bg-black/70 focus:outline-none focus-visible:ring-1 focus-visible:ring-white/70
                  dark:bg-black/50 dark:hover:bg-black/65
                  ${showBiasLabels ? "bottom-1" : "bottom-0"}
                `}
              >
                <span className="min-w-0 truncate">{activeArticle.source?.name ?? "Sursă"}</span>
                <ExternalLink size={9} strokeWidth={2.25} className="shrink-0 opacity-85" aria-hidden />
              </a>
            )}

            {/* Bias Indicator Strip */}
            {showBiasLabels && (
              <div 
                className="absolute bottom-0 left-0 z-[1] w-full h-1" 
                style={{ backgroundColor: colors.hex }} 
                title={`Orientare: ${activeBias}`}
              />
            )}
          </div>

          {/* Body */}
          <div className="flex flex-col flex-1 py-3 pr-3 gap-2 min-w-0">
            {/* Source + Dot Trio */}
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0" onClick={(e) => e.stopPropagation()}>
                {activeArticle.source ? (
                  <SourcePopover source={activeArticle.source} />
                ) : (
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Unknown</span>
                )}
              </div>

              {/* Bias Indicator — Clickable dots to switch perspective */}
              <div
                className="flex items-center gap-1.5 shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                {hasCluster ? (
                  <div className="flex items-center gap-1.5">
                    <div className="flex gap-1">
                      {BIAS_ORDER.map((b) => {
                        const isPresent = row[b] !== null;
                        const isActive = b === activeBias;
                        const bColors = BIAS_COLORS[b];
                        return (
                          <button
                            key={b}
                            onClick={() => isPresent && switchTo(b)}
                            disabled={!isPresent}
                            className={`
                              w-1.5 h-3 transition-all duration-200
                              ${isPresent 
                                ? isActive ? "opacity-100 scale-y-125" : "opacity-30 hover:opacity-60" 
                                : "opacity-5 bg-slate-300 dark:bg-slate-700"
                              }
                            `}
                            style={isPresent ? { backgroundColor: bColors.hex } : {}}
                            title={isPresent ? `Citește din perspectiva de ${biasLabels[b]}` : `Nicio acoperire de ${biasLabels[b]}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="w-1.5 h-3" style={{ backgroundColor: colors.hex }} />
                )}
              </div>
            </div>

            {/* Title — animat la switch perspectivă */}
            <AnimatePresence mode="wait" initial={false}>
              <motion.h3
                key={activeBias + "-title"}
                className={`
                  text-sm sm:text-base font-bold leading-[1.3] text-slate-900 dark:text-slate-100 line-clamp-2 
                  group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors
                  ${settings.titleFont === "serif" ? "font-serif" : "font-sans"}
                `}
                initial={{ opacity: 0, x: swipeDir * 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -swipeDir * 20 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
              >
                {activeArticle.title}
              </motion.h3>
            </AnimatePresence>

            {/* Footer */}
            <div className="flex items-center justify-between mt-auto pt-1 gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-wrap">
                <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 shrink-0">
                  <Clock size={10} />
                  <span suppressHydrationWarning>{timeAgo(activeArticle.published_at)}</span>
                </div>
                {hasAiSummary && !isExpanded && (
                  <span
                    className="inline-flex items-center justify-center shrink-0 text-[var(--accent)]"
                    title="Include sinteză AI — deschide pentru detalii"
                    aria-label="Sinteză AI disponibilă"
                  >
                    <Zap size={14} strokeWidth={2.25} className="fill-[var(--accent)]/25" aria-hidden />
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyLink}
                  title="Copiază link"
                  className="text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 transition-colors"
                >
                  {copied
                    ? <Check size={13} strokeWidth={2.5} className="text-green-500" />
                    : <Link2 size={13} strokeWidth={2.25} />
                  }
                </button>

                {isCardExpandable && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggle(); }}
                    className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white border-b-2 border-slate-900 dark:border-white pb-0.5"
                  >
                    {isExpanded ? <X size={14} strokeWidth={2.5} /> : "Mai multe"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Swipe hint — apare doar dacă există perspective multiple și nu e expandat ── */}
        {available.length > 1 && !isExpanded && (
          <div className="flex items-center justify-center gap-1.5 pb-1.5 pointer-events-none" aria-hidden="true">
            {canSwipeRight && (
              <span className="text-[9px] text-gray-300 dark:text-gray-600">←</span>
            )}
            {available.map((b) => (
              <div
                key={b}
                className={`h-0.5 rounded-sm transition-all duration-200 ${
                  b === activeBias
                    ? `w-4`
                    : "w-2 opacity-20"
                }`}
                style={{ backgroundColor: b === activeBias ? BIAS_COLORS[b].hex : "currentColor" }}
              />
            ))}
            {canSwipeLeft && (
              <span className="text-[9px] text-gray-300 dark:text-gray-600">→</span>
            )}
          </div>
        )}

        {/* ── Cele 3 straturi expandabile ─────────────────────────── */}
        {isCardExpandable && (
          <div
            className={`overflow-hidden transition-[max-height,opacity] ease-out ${
              isExpanded
                ? "max-h-[800px] opacity-100 duration-300"
                : "max-h-0 opacity-0 duration-200"
            }`}
          >
              <div className="px-4 pb-4 pt-1 flex flex-col gap-3 border-t border-gray-100 dark:border-gray-800">

                {/* Strat 1 — The Hook (ai_pre_summary) */}
                {showAiPreSummary && activeArticle.ai_pre_summary && (
                  <div className="flex items-start gap-2">
                    <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[9px] font-black uppercase tracking-widest bg-slate-900 text-white dark:bg-white dark:text-slate-900 mt-0.5">
                      <Zap size={8} className="fill-white dark:fill-slate-900" />
                      Rezumat AI
                    </span>
                    <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug">
                      {activeArticle.ai_pre_summary}
                    </p>
                  </div>
                )}

                {/* Strat 2 — The Context (ai_summary) */}
                {activeArticle.ai_summary && (
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                    {activeArticle.ai_summary}
                  </p>
                )}

                {/* Strat 3 — The Source Proof (original_snippet) */}
                {activeArticle.original_snippet && (
                  <div className="relative rounded-lg border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 px-3 py-2.5 shadow-inner">
                    <span className="absolute -top-2 left-3 inline-flex items-center gap-1 bg-white dark:bg-gray-900 px-1.5 text-[9px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                      <Newspaper size={8} />
                      Fragment original · {activeArticle.source?.name ?? "Sursă"}
                    </span>
                    <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 leading-relaxed italic mt-1">
                      &ldquo;{activeArticle.original_snippet}&rdquo;
                    </p>
                  </div>
                )}

                {/* CTA Final */}
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={activeArticle.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className={`
                      inline-flex items-center gap-1.5
                      px-3 py-1.5 rounded-lg text-xs font-bold
                      border transition-all duration-200
                      ${colors.badge} border-transparent
                      hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500
                    `}
                  >
                    Citește restul articolului pe {activeArticle.source?.name ?? "sursă"} →
                    <ExternalLink size={10} />
                  </a>

                  {activeArticle.subscription_topic && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: deschide modal abonare când auth e implementat
                        alert(`Abonare la: ${activeArticle.subscription_topic}`);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-500 dark:hover:border-slate-400 hover:text-slate-900 dark:hover:text-white transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
                    >
                      <Bell size={10} />
                      Abonează-te la știri despre: {activeArticle.subscription_topic}
                    </button>
                  )}
                </div>
              </div>
          </div>
        )}

        {/* ── Prism Halo ──────────────────────────────────────────── */}
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 right-0 h-[3px] pointer-events-none"
          style={{ background: haloGradient }}
        />
      </article>

      {/* ── Expansion panel cluster (perspective multiple) ──────── */}
      <AnimatePresence>
        {isExpanded && hasCluster && (
          <ExpandedClusterRow row={row} onCollapse={onToggle} />
        )}
      </AnimatePresence>
    </div>
  );
}
