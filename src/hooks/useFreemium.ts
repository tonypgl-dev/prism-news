"use client";

import { useEffect, useState } from "react";

const LS_KEY = "prism-first-visit";

export function useFreemium() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [daysUsed, setDaysUsed] = useState(0);

  useEffect(() => {
    let firstVisit: number;
    const stored = localStorage.getItem(LS_KEY);
    if (stored) {
      firstVisit = new Date(stored).getTime();
    } else {
      firstVisit = Date.now();
      localStorage.setItem(LS_KEY, new Date(firstVisit).toISOString());
    }
    const days = Math.floor((Date.now() - firstVisit) / 86_400_000);
    setDaysUsed(days);
    setIsLoaded(true);
  }, []);

  const isPremium = !isLoaded ? true : daysUsed <= 3;

  return { isPremium, daysUsed, isLoaded };
}
