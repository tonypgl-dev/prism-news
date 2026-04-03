"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ALL_CATEGORY_KEYS,
  ALL_REGION_KEYS,
  type CategoryKey,
  type RegionKey,
} from "@/lib/categories";

const LS_KEY = "prisma-feed-filter";

interface FeedFilterState {
  categories: CategoryKey[];
  regions: RegionKey[];
}

const DEFAULT_STATE: FeedFilterState = {
  categories: [...ALL_CATEGORY_KEYS],
  regions: [...ALL_REGION_KEYS],
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
    setFilter({ categories: [...ALL_CATEGORY_KEYS], regions: [...ALL_REGION_KEYS] });
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
    isAllSelected,
    activeFilterCount,
  };
}
