"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { Article } from "@/types";
import { BIAS_COLORS, timeAgo, titleToFeaturedSlug } from "@/lib/utils";

type SearchApiResponse = {
  results: Article[];
  extended: boolean;
  total: number;
  error?: string;
};

const DEBOUNCE_MS = 300;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

interface SearchBarProps {
  className?: string;
  onRequestClose?: () => void;
  /** Focus input when panel opens (ex. căutare mobilă). */
  autoFocus?: boolean;
}

export function SearchBar({ className = "", onRequestClose, autoFocus }: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [extended, setExtended] = useState(false);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runFetch = useCallback(async (q: string, ext: boolean) => {
    if (q.trim().length < 2) {
      setResults([]);
      setTotal(0);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const url = `/api/search?q=${encodeURIComponent(q.trim())}&extended=${ext ? "true" : "false"}`;
      const res = await fetch(url);
      const data = (await res.json()) as SearchApiResponse;
      if (!res.ok) {
        setError(data.error ?? "Căutarea a eșuat.");
        setResults([]);
        setTotal(0);
      } else {
        setResults(data.results);
        setTotal(data.total);
      }
    } catch {
      setError("Eroare de rețea.");
      setResults([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const scheduleFetch = useCallback(
    (q: string, ext: boolean) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (q.trim().length < 2) {
        setResults([]);
        setTotal(0);
        setLoading(false);
        setOpen(false);
        return;
      }
      debounceRef.current = setTimeout(() => {
        void runFetch(q, ext);
      }, DEBOUNCE_MS);
    },
    [runFetch]
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    if (query.trim().length >= 2) {
      setOpen(true);
      scheduleFetch(query, extended);
    } else {
      setOpen(false);
      setResults([]);
      setTotal(0);
    }
  }, [query, extended, scheduleFetch]);

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const weekAgoTs = Date.now() - WEEK_MS;
  const hasOlderThanWeek =
    extended && results.some((a) => new Date(a.published_at).getTime() < weekAgoTs);

  function handleArchiveSearch() {
    setExtended(true);
    setOpen(true);
  }

  function handleResultClick(article: Article) {
    const featured = article.cluster_id ?? titleToFeaturedSlug(article.title);
    setOpen(false);
    setQuery("");
    onRequestClose?.();
    router.push(`/?featured=${featured}`);
  }

  const showEmptyRecent = !loading && !extended && query.trim().length >= 2 && results.length === 0;
  const showEmptyArchive =
    !loading && extended && query.trim().length >= 2 && results.length === 0 && !error;
  const showArchiveHintFew =
    !loading && !extended && results.length > 0 && results.length < 3 && query.trim().length >= 2;

  return (
    <div ref={wrapRef} className={`relative z-50 ${className}`}>
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => {
          if (query.trim().length >= 2) setOpen(true);
        }}
        aria-label="Caută știri"
        autoComplete="off"
        spellCheck={false}
        className="w-full rounded-sm border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm
          placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400
          dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500
          dark:focus:border-zinc-500 dark:focus:ring-zinc-600"
        placeholder="Caută în știri…"
      />

      <AnimatePresence>
        {open && query.trim().length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
            className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[min(70vh,28rem)] overflow-hidden rounded-sm border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
          >
            {loading && (
              <div className="space-y-2 p-3" aria-busy="true" aria-label="Se încarcă">
                <div className="h-3 w-full animate-pulse rounded-sm bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-3 w-4/5 animate-pulse rounded-sm bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-3 w-3/5 animate-pulse rounded-sm bg-zinc-200 dark:bg-zinc-800" />
              </div>
            )}

            {!loading && error && (
              <p className="p-3 text-xs text-red-600 dark:text-red-400">{error}</p>
            )}

            {!loading && !error && (
              <>
                {hasOlderThanWeek && (
                  <p className="border-b border-zinc-100 bg-zinc-50 px-3 py-2 text-[10px] font-medium text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-400">
                    Afișăm rezultate mai vechi de 7 zile
                  </p>
                )}

                {showEmptyRecent && (
                  <div className="p-3">
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      Nicio știre recentă.{" "}
                      <button
                        type="button"
                        onClick={handleArchiveSearch}
                        className="font-semibold text-zinc-900 underline underline-offset-2 hover:no-underline dark:text-zinc-100"
                      >
                        Caută în toată arhiva →
                      </button>
                    </p>
                  </div>
                )}

                {showEmptyArchive && (
                  <p className="p-3 text-xs text-zinc-600 dark:text-zinc-400">Niciun rezultat în arhivă.</p>
                )}

                {results.length > 0 && (
                  <ul
                    role="listbox"
                    aria-label="Rezultate căutare"
                    className="max-h-[min(65vh,24rem)] overflow-y-auto py-1"
                  >
                    {results.map((article) => {
                      const dot = BIAS_COLORS[article.bias];
                      return (
                        <li key={article.id} role="presentation">
                          <button
                            type="button"
                            role="option"
                            onClick={() => handleResultClick(article)}
                            className="flex w-full gap-2 px-3 py-2.5 text-left transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800/80"
                          >
                            <span
                              className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                              style={{ backgroundColor: dot.hex }}
                              aria-hidden
                            />
                            <span className="min-w-0 flex-1">
                              <span className="line-clamp-2 text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                                {article.title}
                              </span>
                              <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-zinc-500 dark:text-zinc-400">
                                <span>{article.source?.name ?? "Sursă"}</span>
                                <span aria-hidden>·</span>
                                <span suppressHydrationWarning>{timeAgo(article.published_at)}</span>
                              </span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}

                {showArchiveHintFew && (
                  <div className="border-t border-zinc-100 px-3 py-2 dark:border-zinc-800">
                    <button
                      type="button"
                      onClick={handleArchiveSearch}
                      className="text-[11px] font-semibold text-zinc-700 underline underline-offset-2 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
                    >
                      Caută în arhivă pentru mai multe →
                    </button>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
