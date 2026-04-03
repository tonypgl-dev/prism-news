"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ClusterRow } from "@/types";

const LS_KEY = "prismnews_topic_scores";
const DECAY = 0.92;         // scorul se degradează cu 8% pe sesiune
const CLICK_BOOST = 10;     // câte puncte adaugă un click
const TOP_N = 50;           // câte topic-uri păstrăm

// ----------------------------------------------------------------
// Tipuri
// ----------------------------------------------------------------

type ScoreMap = Record<string, number>;  // cluster_id → scor

// ----------------------------------------------------------------
// Helpers localStorage
// ----------------------------------------------------------------

function loadScores(): ScoreMap {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? "{}") as ScoreMap;
  } catch {
    return {};
  }
}

function saveScores(scores: ScoreMap) {
  // Păstrează doar top N scoruri pentru a limita dimensiunea
  const trimmed = Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, TOP_N);
  localStorage.setItem(LS_KEY, JSON.stringify(Object.fromEntries(trimmed)));
}

function applyDecay(scores: ScoreMap): ScoreMap {
  return Object.fromEntries(
    Object.entries(scores).map(([k, v]) => [k, v * DECAY])
  );
}

// ----------------------------------------------------------------
// Hook
// ----------------------------------------------------------------

export function usePersonalization() {
  const [scores, setScores] = useState<ScoreMap>({});
  const initialized = useRef(false);

  // Încarcă scorurile din localStorage o singură dată (după hydration)
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const loaded = applyDecay(loadScores());   // aplică decay la fiecare sesiune
    setScores(loaded);
    saveScores(loaded);
  }, []);

  // Înregistrează un click pe un cluster_id
  const recordClick = useCallback((clusterId: string) => {
    setScores((prev) => {
      const next = { ...prev, [clusterId]: (prev[clusterId] ?? 0) + CLICK_BOOST };
      saveScores(next);
      return next;
    });
  }, []);

  // Sortează un array de ClusterRow după scor descrescător,
  // păstrând ordinea relativă pentru tie-break (stabiliție)
  const sortRows = useCallback(
    (rows: ClusterRow[]): ClusterRow[] => {
      if (Object.keys(scores).length === 0) return rows;
      return [...rows].sort(
        (a, b) => (scores[b.cluster_id] ?? 0) - (scores[a.cluster_id] ?? 0)
      );
    },
    [scores]
  );

  const hasPersonalization = Object.keys(scores).length > 0;

  return { scores, recordClick, sortRows, hasPersonalization };
}
