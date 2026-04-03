"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { AlertTriangle, List, Rows3, Lock, X, Sparkles, Loader2 } from "lucide-react";
import { useFreemium } from "@/hooks/useFreemium";
import type { ClusterRow } from "@/types";
import { AlignedGrid } from "./AlignedGrid";
import { DiscoveryFeed } from "./DiscoveryFeed";
import { isBlindspot } from "@/lib/utils";
import { AlertCircle } from "lucide-react";
import { FeedFilterPanel } from "./FeedFilterPanel";
import { useFeedFilter, dateRangeToIso } from "@/hooks/useFeedFilter";
import {
  detectCategory,
  detectRegion,
  type CategoryKey,
  type RegionKey,
} from "@/lib/categories";

type ViewMode = "discovery" | "aligned";

interface Props {
  rows: ClusterRow[];
  totalArticles: number;
  initialFrom: string;
}

export function NewsPageClient({ rows: initialRows, totalArticles, initialFrom }: Props) {
  const [mode, setMode] = useState<ViewMode>("discovery");
  const [blindspotOnly, setBlindspotOnly] = useState(false);
  const [upsellOpen, setUpsellOpen] = useState(false);
  const { isPremium, daysUsed, isLoaded } = useFreemium();

  // ── Infinite scroll state ────────────────────────────────────────────
  const [rows, setRows] = useState<ClusterRow[]>(initialRows);
  const [loadedOffset, setLoadedOffset] = useState(initialRows.length);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentFrom, setCurrentFrom] = useState(initialFrom);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Resetăm la schimbarea datelor initiale (dateRange schimbat)
  const prevFrom = useRef(initialFrom);

  const feedFilter = useFeedFilter();
  const { filter, activeFilterCount } = feedFilter;

  // Sync dateRange cu rows (fetch nou când se schimbă intervalul)
  useEffect(() => {
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
      setRows(initialRows);
      setLoadedOffset(initialRows.length);
      setHasMore(true);
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

  const spectrumDist = useMemo(() => ({
    left:   rows.filter((r) => r.left   !== null).length,
    center: rows.filter((r) => r.center !== null).length,
    right:  rows.filter((r) => r.right  !== null).length,
  }), [rows]);

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

  const visibleRows = useMemo(
    () => (blindspotOnly ? filteredRows.filter(isBlindspot) : filteredRows),
    [filteredRows, blindspotOnly]
  );

  return (
    <>
      {/* ── Banner freemium ───────────────────────────────────────── */}
      {isLoaded && !isPremium && (
        <div className="bg-violet-950/60 dark:bg-violet-950/80 border border-violet-700/50 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-violet-200">
            <Lock size={14} className="text-violet-400 shrink-0" />
            <span>
              Ai folosit Prisma News {daysUsed} zile.
              <span className="font-bold text-violet-300"> Vizualizarea aliniată și filtrele avansate sunt dezactivate.</span>
            </span>
          </div>
          <button className="text-xs font-bold text-violet-300 hover:text-white underline underline-offset-2 transition-colors whitespace-nowrap">
            Păstrează accesul · 39 lei/lună →
          </button>
        </div>
      )}

      {/* ── Toolbar ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">

        {/* Zona stângă — informațional */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {filteredRows.length}{rows.length !== filteredRows.length ? ` / ${rows.length}` : ""} subiecte
          </span>
          <span className="text-xs text-gray-400">·</span>
          <div className="flex gap-1">
            <span className="bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
              {spectrumDist.left}
            </span>
            <span className="bg-slate-400 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
              {spectrumDist.center}
            </span>
            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
              {spectrumDist.right}
            </span>
          </div>
          {blindspotCount > 0 && (
            <>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-amber-600 dark:text-amber-400">{blindspotCount} blindspot-uri</span>
            </>
          )}
        </div>

        {/* Zona dreaptă — acțiuni */}
        <div className="flex items-center gap-2 ml-auto">

          {/* View mode toggle */}
          <div
            className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1 gap-1 shrink-0"
            role="group"
            aria-label="Mod de afișare"
          >
            <button
              onClick={() => setMode("discovery")}
              aria-pressed={mode === "discovery"}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 ${
                mode === "discovery"
                  ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              <List size={13} />
              Discovery
            </button>
            <button
              onClick={() => isPremium ? setMode("aligned") : setUpsellOpen(true)}
              aria-pressed={mode === "aligned"}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 ${
                mode === "aligned"
                  ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm"
                  : !isPremium && isLoaded
                  ? "text-violet-400 dark:text-violet-400 hover:text-violet-300"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              <Rows3 size={13} />
              Aliniat
              {!isPremium && isLoaded && <Lock size={10} className="ml-0.5" />}
            </button>
          </div>

          {/* Feed filter */}
          <FeedFilterPanel counts={categoryCounts} regionCounts={regionCounts} filterHook={feedFilter} />

          {/* Filtru Blindspot */}
          {isPremium && (
            <button
              onClick={() => setBlindspotOnly((v) => !v)}
              aria-pressed={blindspotOnly}
              className={`
                inline-flex items-center gap-2 px-4 py-2 rounded-lg
                text-xs font-bold border transition-all duration-200 shrink-0
                focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500
                ${
                  blindspotOnly
                    ? "bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-200 dark:shadow-amber-900/40"
                    : "bg-white dark:bg-gray-900 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20"
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
                    <span className="bg-amber-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {blindspotCount}
                    </span>
                  )}
                </>
              )}
            </button>
          )}
        </div>
      </div>

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
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              {visibleRows.length === 0
                ? "Niciun blindspot detectat astăzi"
                : `${visibleRows.length} subiect${visibleRows.length === 1 ? "" : "e"} ignorate de cel puțin o tabără editorială`}
            </p>
            <p className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-0.5">
              Citește critic. Subiectele de mai jos lipsesc din cel puțin o parte a spectrului.
            </p>
          </div>
        </div>
      )}

      {/* ── Conținut principal ────────────────────────────────────── */}
      {visibleRows.length === 0 && blindspotOnly ? (
        <EmptyBlindspot onReset={() => setBlindspotOnly(false)} />
      ) : mode === "discovery" ? (
        <DiscoveryFeed rows={visibleRows} />
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
            className="relative w-full max-w-md rounded-2xl bg-gray-950 border border-violet-700/50 p-6 shadow-2xl shadow-violet-900/30"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setUpsellOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
              aria-label="Închide"
            >
              <X size={18} />
            </button>

            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-violet-600/20 border border-violet-500/30 mb-4">
              <Sparkles size={22} className="text-violet-400" />
            </div>

            <h2 className="text-lg font-bold text-white mb-1">
              Vizualizarea Aliniată este Premium
            </h2>
            <p className="text-sm text-gray-400 mb-4 leading-relaxed">
              Modul <span className="text-white font-semibold">Aliniat</span> îți arată aceeași știre din
              perspectiva presei de stânga, centru și dreapta — pe același rând, față în față.
              Ai folosit Prisma News <span className="text-violet-300 font-semibold">{daysUsed} zile</span> din cele 3 gratuite.
            </p>

            <ul className="space-y-2 mb-5">
              {[
                "Prism View — 3 coloane aliniate per subiect",
                "Filtre Blindspot — știri ignorate de o tabără",
                "Acces nelimitat la arhiva de clustere",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2 text-xs text-gray-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            <button className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm transition-colors">
              Activează Premium · 39 lei/lună
            </button>
            <p className="text-center text-[11px] text-gray-600 mt-2">
              Anulezi oricând · Fără abonament automat
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
      <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
        <AlertCircle size={18} className="text-green-500" />
      </div>
      <p className="font-semibold text-gray-700 dark:text-gray-300 text-sm">
        Presa acoperă echilibrat toate subiectele astăzi!
      </p>
      <button
        onClick={onReset}
        className="text-xs text-purple-600 dark:text-purple-400 underline underline-offset-2"
      >
        Înapoi la toate știrile
      </button>
    </div>
  );
}
