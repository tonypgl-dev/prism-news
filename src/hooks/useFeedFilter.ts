"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ALL_CATEGORY_KEYS,
  ALL_REGION_KEYS,
  type CategoryKey,
  type RegionKey,
} from "@/lib/categories";

const LS_KEY = "prisma-feed-filter";

export type DateRange = "24h" | "3d" | "7d" | "30d";

export const DATE_RANGE_OPTIONS: { key: DateRange; label: string }[] = [
  { key: "24h", label: "Ultimele 24 ore" },
  { key: "3d",  label: "Ultimele 3 zile" },
  { key: "7d",  label: "Ultima săptămână" },
  { key: "30d", label: "Ultima lună" },
];

export function dateRangeToIso(range: DateRange): string {
  const ms: Record<DateRange, number> = {
    "24h": 24 * 60 * 60 * 1000,
    "3d":  3  * 24 * 60 * 60 * 1000,
    "7d":  7  * 24 * 60 * 60 * 1000,
    "30d": 30 * 24 * 60 * 60 * 1000,
  };
  return new Date(Date.now() - ms[range]).toISOString();
}

interface FeedFilterState {
  categories: CategoryKey[];
  regions: RegionKey[];
  dateRange: DateRange;
}

const DEFAULT_STATE: FeedFilterState = {
  categories: [...ALL_CATEGORY_KEYS],
  regions: [...ALL_REGION_KEYS],
  dateRange: "24h",
};

export type FeedFilterHook = ReturnType<typeof useFeedFilter>;

export function useFeedFilter() {
  const [filter, setFilter] = useState<FeedFilterState>(DEFAULT_STATE);
  const [isLoaded, setIsLoaded] = useState(false);

  // Citim din localStorage după mount (SSR safe)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<FeedFilterState>;
        setFilter({
          categories: parsed.categories ?? [...ALL_CATEGORY_KEYS],
          regions: parsed.regions ?? [...ALL_REGION_KEYS],
          dateRange: parsed.dateRange ?? "24h",
        });
      }
    } catch {
      // localStorage indisponibil — rămânem pe default
    }
    setIsLoaded(true);
  }, []);

  // Persistăm orice schimbare
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(filter));
    } catch {
      // ignore
    }
  }, [filter, isLoaded]);

  const toggleCategory = useCallback((key: CategoryKey) => {
    setFilter((prev) => {
      const has = prev.categories.includes(key);
      // Nu permite dezactivarea tuturor categoriilor
      if (has && prev.categories.length === 1) return prev;
      return {
        ...prev,
        categories: has
          ? prev.categories.filter((c) => c !== key)
          : [...prev.categories, key],
      };
    });
  }, []);

  const toggleRegion = useCallback((key: RegionKey) => {
    setFilter((prev) => ({
      ...prev,
      regions: prev.regions.includes(key)
        ? prev.regions.filter((r) => r !== key)
        : [...prev.regions, key],
    }));
  }, []);

  const selectAll = useCallback(() => {
    setFilter((prev) => ({
      ...prev,
      categories: [...ALL_CATEGORY_KEYS],
      regions: [...ALL_REGION_KEYS],
    }));
  }, []);

  const setDateRange = useCallback((range: DateRange) => {
    setFilter((prev) => ({ ...prev, dateRange: range }));
  }, []);

  const isAllSelected =
    filter.categories.length === ALL_CATEGORY_KEYS.length &&
    filter.regions.length === ALL_REGION_KEYS.length;

  const activeFilterCount =
    ALL_CATEGORY_KEYS.length - filter.categories.length +
    ALL_REGION_KEYS.length - filter.regions.length;

  return {
    filter,
    isLoaded,
    toggleCategory,
    toggleRegion,
    selectAll,
    setDateRange,
    isAllSelected,
    activeFilterCount,
  };
}
