"use client";

import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, List, Rows3, Lock, X, Sparkles, Loader2, ChevronsUp } from "lucide-react";
import { useFreemium } from "@/hooks/useFreemium";
import { useSettings } from "@/hooks/useSettings";
import type { ClusterRow } from "@/types";
import { AlignedGrid } from "./AlignedGrid";
import { DiscoveryFeed } from "./DiscoveryFeed";
import { isBlindspot } from "@/lib/utils";
import { AlertCircle } from "lucide-react";
import { FeedFilterPanel } from "./FeedFilterPanel";
import { SortOrderDropdown, type SortOrder } from "./SortOrderDropdown";
import { useFeedFilter, dateRangeToIso, type DateRange } from "@/hooks/useFeedFilter";
import {
  detectCategory,
  detectRegion,
  type CategoryKey,
  type RegionKey,
} from "@/lib/categories";
import type { BiasFilter } from "./SpectrumSection";

type ViewMode = "discovery" | "aligned";

interface Props {
  rows: ClusterRow[];
  totalArticles: number;
  initialFrom: string;
  defaultDateRange?: DateRange;
  biasFilter?: BiasFilter;
  toolbarPrefix?: React.ReactNode;
  featuredClusterId?: string;
}

export function NewsPageClient({
  rows: initialRows,
  totalArticles,
  initialFrom,
  defaultDateRange,
  biasFilter = "all",
  toolbarPrefix,
  featuredClusterId,
}: Props) {
  // Latch: reținem featuredClusterId de la primul render (supraviețuiește URL cleanup)
  const [pinnedClusterId] = useState<string | undefined>(featuredClusterId);
  const [mode, setMode] = useState<ViewMode>("discovery");
  const [sortMode, setSortMode] = useState<SortOrder>("recent");
  const [blindspotOnly, setBlindspotOnly] = useState(false);
  const [upsellOpen, setUpsellOpen] = useState(false);
  const [feedControlsOpen, setFeedControlsOpen] = useState(false);
  const [toolbarAnimating, setToolbarAnimating] = useState(false);
  const { isPremium, daysUsed, isLoaded } = useFreemium();
  const { settings } = useSettings();

  // ── Featured cluster (din link Facebook / search) ────────────────────
  useEffect(() => {
    if (!featuredClusterId) return;
    setSortMode("recommended");
    // history.replaceState curăță URL-ul fără să retriggereze server render
    window.history.replaceState(null, "", "/");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [featuredClusterId]);

  // ── Infinite scroll state ────────────────────────────────────────────
  const [rows, setRows] = useState<ClusterRow[]>(initialRows);
  const [loadedOffset, setLoadedOffset] = useState(initialRows.length);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentFrom, setCurrentFrom] = useState(initialFrom);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const skipNextDateRangeSync = useRef(true);

  // Resetăm la schimbarea datelor initiale (dateRange schimbat)
  const prevFrom = useRef(initialFrom);

  const feedFilter = useFeedFilter(
    defaultDateRange ? { defaultDateRange } : undefined
  );
  const { filter, activeFilterCount } = feedFilter;

  // Sync dateRange cu rows (fetch nou când se schimbă intervalul)
  useEffect(() => {
    if (skipNextDateRangeSync.current) {
      skipNextDateRangeSync.current = false;
      return;
    }
    const newFrom = dateRangeToIso(filter.dateRange);
    if (newFrom === currentFrom) return;

    setCurrentFrom(newFrom);
    setRows([]);
    setLoadedOffset(0);
    setHasMore(true);

    // Fetch primul batch cu noul interval
    fetch(`/api/articles?offset=0&limit=30&from=${encodeURIComponent(newFrom)}`)
      .then((r) => r.json())
      .then((data: { rows: ClusterRow[]; total: number }) => {
        setRows(data.rows);
        setLoadedOffset(data.rows.length);
        setHasMore(data.rows.length < data.total);
      })
      .catch(console.error);
  }, [filter.dateRange]); // eslint-disable-line react-hooks/exhaustive-deps

  // Resetăm rows când initialRows se schimbă (navigare)
  useEffect(() => {
    if (prevFrom.current !== initialFrom) {
      prevFrom.current = initialFrom;
      setCurrentFrom(initialFrom);
      setRows(initialRows);
      setLoadedOffset(initialRows.length);
      setHasMore(true);
      skipNextDateRangeSync.current = true;
    }
  }, [initialRows, initialFrom]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const res = await fetch(
        `/api/articles?offset=${loadedOffset}&limit=10&from=${encodeURIComponent(currentFrom)}`
      );
      const data: { rows: ClusterRow[]; total: number } = await res.json();
      setRows((prev) => [...prev, ...data.rows]);
      setLoadedOffset((prev) => prev + data.rows.length);
      setHasMore(loadedOffset + data.rows.length < data.total);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, loadedOffset, currentFrom]);

  // IntersectionObserver pentru sentinel
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMore();
        }
      },
      { rootMargin: "400px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, loadMore]);

  // ── Freemium ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (isLoaded && !isPremium && mode === "aligned") setMode("discovery");
    if (!isPremium) setBlindspotOnly(false);
  }, [isLoaded, isPremium, mode]);

  // ── Stats ─────────────────────────────────────────────────────────────
  const blindspotCount = useMemo(() => rows.filter(isBlindspot).length, [rows]);


  // ── Filtrare categorii ────────────────────────────────────────────────
  const rowsWithCategory = useMemo(() =>
    rows.map((row) => {
      const article = row.left ?? row.center ?? row.right;
      const title = article?.title ?? "";
      const category = detectCategory(title);
      const region = category === "regional" ? detectRegion(title) : null;
      return { row, category, region };
    }),
  [rows]);

  const categoryCounts = useMemo(() => {
    const counts: Partial<Record<CategoryKey, number>> = {};
    rowsWithCategory.forEach(({ category }) => {
      counts[category] = (counts[category] ?? 0) + 1;
    });
    return counts;
  }, [rowsWithCategory]);

  const regionCounts = useMemo(() => {
    const counts: Partial<Record<RegionKey, number>> = {};
    rowsWithCategory.forEach(({ category, region }) => {
      if (category === "regional" && region) {
        counts[region] = (counts[region] ?? 0) + 1;
      }
    });
    return counts;
  }, [rowsWithCategory]);

  const filteredRows = useMemo(() =>
    rowsWithCategory
      .filter(({ category, region }) => {
        if (!filter.categories.includes(category)) return false;
        if (category === "regional") {
          if (region && !filter.regions.includes(region)) return false;
        }
        return true;
      })
      .map(({ row }) => row),
  [rowsWithCategory, filter]);

  const biasFilteredRows = useMemo(
    () => biasFilter === "all" ? filteredRows : filteredRows.filter((r) => r[biasFilter] !== null),
    [filteredRows, biasFilter]
  );

  const sortedRows = useMemo(() => {
    const base = blindspotOnly ? biasFilteredRows.filter(isBlindspot) : biasFilteredRows;
    if (sortMode === "popular") {
      return [...base].sort((a, b) => {
        const scoreA = (a.left ? 1 : 0) + (a.center ? 1 : 0) + (a.right ? 1 : 0);
        const scoreB = (b.left ? 1 : 0) + (b.center ? 1 : 0) + (b.right ? 1 : 0);
        return scoreB - scoreA;
      });
    }
    if (sortMode === "recommended") {
      const perspectives = (r: ClusterRow) =>
        (r.left ? 1 : 0) + (r.center ? 1 : 0) + (r.right ? 1 : 0);
      const hasAi = (r: ClusterRow) =>
        [r.left, r.center, r.right].some(
          (a) => a && (a.ai_pre_summary || a.ai_summary)
        );
      const latestTs = (r: ClusterRow) =>
        Math.max(
          0,
          ...[r.left, r.center, r.right]
            .filter(Boolean)
            .map((a) => new Date(a!.published_at).getTime())
        );
      return [...base].sort((a, b) => {
        const sa = perspectives(a) * 1000 + (hasAi(a) ? 100 : 0);
        const sb = perspectives(b) * 1000 + (hasAi(b) ? 100 : 0);
        if (sb !== sa) return sb - sa;
        return latestTs(b) - latestTs(a);
      });
    }
    // "recent" — ordinea default e deja DESC published_at din server
    return base;
  }, [biasFilteredRows, blindspotOnly, sortMode]);

  const visibleRows = sortedRows;

  return (
    <>
      {/* ── Banner freemium ───────────────────────────────────────── */}
      {isLoaded && !isPremium && (
        <div className="bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/50 rounded-sm px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-950 dark:text-slate-200">
            <Lock size={14} className="text-slate-600 dark:text-slate-400 shrink-0" />
            <span>
              Ai folosit Prisma News {daysUsed} zile.
              <span className="font-bold text-slate-800 dark:text-slate-300"> Vizualizarea aliniată și filtrele avansate sunt dezactivate.</span>
            </span>
          </div>
          <button className="text-xs font-bold text-slate-800 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white underline underline-offset-2 transition-colors whitespace-nowrap">
            Păstrează accesul · 39 lei/lună →
          </button>
        </div>
      )}

      {/* Reset filtru */}
      {isPremium && blindspotOnly && (
        <button
          onClick={() => setBlindspotOnly(false)}
          className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          Toate subiectele ({rows.length})
        </button>
      )}

      {/* ── Banner blindspot ──────────────────────────────────────── */}
      {isPremium && blindspotOnly && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-sm bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <AlertTriangle size={16} className="text-slate-900 dark:text-white shrink-0 mt-0.5" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white leading-tight">
              {visibleRows.length === 0
                ? "No Blindspots Detected Today"
                : `${visibleRows.length} Story Cluster${visibleRows.length === 1 ? "" : "s"} with Editorial Gaps`}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">
              Read critically. These stories are being ignored by at least one side of the spectrum.
            </p>
          </div>
        </div>
      )}

      {/* ── Toolbar: ascuns implicit; deschide deasupra butonului cu săgeți ─ */}
      <AnimatePresence initial={false}>
        {feedControlsOpen && (
          <motion.div
            key="feed-toolbar"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
            style={{
              overflow: toolbarAnimating ? "hidden" : "visible",
              position: "relative",
              zIndex: 20,
            }}
            onAnimationStart={() => setToolbarAnimating(true)}
            onAnimationComplete={() => setToolbarAnimating(false)}
          >
            <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-200/80 dark:border-slate-800/80 mb-1">
              {toolbarPrefix}
              <FeedFilterPanel counts={categoryCounts} regionCounts={regionCounts} filterHook={feedFilter} />
              <SortOrderDropdown value={sortMode} onChange={setSortMode} />
              <div
                className="flex items-center bg-slate-100 dark:bg-gray-800 rounded-sm p-1 gap-1 shrink-0"
                role="group"
                aria-label="Mod de afișare"
              >
                <button
                  onClick={() => setMode("discovery")}
                  aria-pressed={mode === "discovery"}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-semibold transition-all duration-200 ${
                    mode === "discovery"
                      ? "bg-[var(--card)] dark:bg-gray-900 text-slate-900 dark:text-slate-100 shadow-sm"
                      : "text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-gray-200"
                  }`}
                >
                  <List size={13} />
                  Discovery
                </button>
                <button
                  onClick={() => isPremium ? setMode("aligned") : setUpsellOpen(true)}
                  aria-pressed={mode === "aligned"}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-semibold transition-all duration-200 ${
                    mode === "aligned"
                      ? "bg-[var(--card)] dark:bg-gray-900 text-slate-900 dark:text-slate-100 shadow-sm"
                      : !isPremium && isLoaded
                      ? "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                      : "text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-gray-200"
                  }`}
                >
                  <Rows3 size={13} />
                  Aliniat
                  {!isPremium && isLoaded && <Lock size={10} className="ml-0.5" />}
                </button>
              </div>
              {isPremium && settings.showBlindspots && (
                <button
                  onClick={() => setBlindspotOnly((v) => !v)}
                  aria-pressed={blindspotOnly}
                  className={`
                    inline-flex items-center gap-2 px-4 py-2 rounded-sm
                    text-xs font-bold border transition-all duration-200 shrink-0
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500
                    ${
                      blindspotOnly
                        ? "bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-200 dark:shadow-amber-900/40"
                        : "bg-[var(--card)] dark:bg-gray-900 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                    }
                  `}
                >
                  <AlertTriangle size={13} />
                  {blindspotOnly ? (
                    <span>Blindspot-uri active — click pentru toate</span>
                  ) : (
                    <>
                      <span>Blindspot-uri</span>
                      {blindspotCount > 0 && (
                        <span className="bg-amber-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
                          {blindspotCount}
                        </span>
                      )}
                    </>
                  )}
                </button>
              )}
              {settings.showBlindspots && blindspotCount > 0 && !isPremium && (
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 shrink-0">
                  {blindspotCount} Blindspots detected
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Deschide filtrele (înainte de primul card) ─ */}
      <div className="relative flex w-full -mb-px">
        <button
          type="button"
          onClick={() => setFeedControlsOpen((v) => !v)}
          aria-expanded={feedControlsOpen}
          aria-label={feedControlsOpen ? "Ascunde opțiunile" : "Opțiuni feed"}
          title={feedControlsOpen ? "Ascunde opțiunile" : "Opțiuni feed"}
          className="flex items-center gap-1 px-2 py-0.5 rounded-t-sm bg-[var(--card)] border border-b-0 border-gray-200 dark:border-gray-800 text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 transition-colors focus:outline-none"
        >
          <motion.span
            animate={{ rotate: feedControlsOpen ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
            aria-hidden
          >
            <ChevronsUp className="h-2.5 w-2.5" strokeWidth={2.5} />
          </motion.span>
        </button>
      </div>

      {/* ── Conținut principal ────────────────────────────────────── */}
      {visibleRows.length === 0 && blindspotOnly ? (
        <EmptyBlindspot onReset={() => setBlindspotOnly(false)} />
      ) : mode === "discovery" ? (
        <DiscoveryFeed rows={visibleRows} biasFilter={biasFilter} sortOrder={sortMode} featuredClusterId={pinnedClusterId} />
      ) : (
        <AlignedGrid rows={visibleRows} />
      )}

      {/* ── Sentinel pentru infinite scroll ──────────────────────── */}
      <div ref={sentinelRef} className="h-4" aria-hidden="true" />

      {/* Indicator loading */}
      {isLoadingMore && (
        <div className="flex justify-center py-6">
          <Loader2 size={20} className="animate-spin text-gray-400" />
        </div>
      )}

      {/* Mesaj end of feed */}
      {!hasMore && rows.length > 0 && (
        <p className="text-center text-xs text-gray-400 dark:text-gray-600 py-6">
          Ai văzut toate știrile din intervalul selectat.
        </p>
      )}

      {/* ── Modal upsell ─────────────────────────────────────────── */}
      {upsellOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setUpsellOpen(false)}
        >
          <div
            className="relative w-full max-w-md rounded-sm bg-white dark:bg-gray-950 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl shadow-black/20"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setUpsellOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 dark:text-gray-500 dark:hover:text-white transition-colors"
              aria-label="Închide"
            >
              <X size={18} />
            </button>

            <div className="flex items-center justify-center w-12 h-12 rounded-sm bg-slate-900 dark:bg-white border border-slate-900 dark:border-white mb-4">
              <Sparkles size={22} className="text-white dark:text-slate-900" />
            </div>

            <h2 className="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-slate-100 mb-1">
              Prism View Premium Access
            </h2>
            <p className="text-sm text-slate-600 dark:text-gray-400 mb-4 leading-relaxed">
              Modul <span className="text-slate-900 dark:text-slate-100 font-bold">Aliniat</span> îți arată aceeași știre din
              perspectiva presei de stânga, centru și dreapta — pe același rând, față în față.
              Ai folosit Prisma News <span className="text-slate-900 dark:text-slate-100 font-bold">{daysUsed} zile</span> din cele 3 gratuite.
            </p>

            <ul className="space-y-3 mb-6">
              {[
                "Prism View — 3 coloane aliniate per subiect",
                "Filtre Blindspot — știri ignorate de o tabără",
                "Acces nelimitat la arhiva de clustere",
              ].map((f) => (
                <li key={f} className="flex items-center gap-3 text-xs font-bold uppercase tracking-wide text-slate-700 dark:text-gray-300">
                  <div className="w-1.5 h-3 bg-slate-900 dark:bg-white shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            <button className="w-full py-4 rounded-sm bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 font-black uppercase tracking-widest text-xs transition-all">
              Activate Premium · 39 RON/Month
            </button>
            <p className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-gray-600 mt-3">
              No automatic subscription · Cancel anytime
            </p>
          </div>
        </div>
      )}
    </>
  );
}

function EmptyBlindspot({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <div className="w-10 h-10 rounded-sm bg-slate-900 dark:bg-white flex items-center justify-center">
        <AlertCircle size={18} className="text-white dark:text-slate-900" />
      </div>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">
        Balanced Coverage Detected
      </p>
      <button
        onClick={onReset}
        className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors underline underline-offset-4"
      >
        View All Stories
      </button>
    </div>
  );
}
