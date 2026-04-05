"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";

const STORAGE_KEY = "prisma_visitor_id";

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function formatCount(n: number): string {
  return n.toLocaleString("ro-RO");
}

export function VisitorCounter() {
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    let visitorId = localStorage.getItem(STORAGE_KEY);
    if (!visitorId) {
      visitorId = generateUUID();
      localStorage.setItem(STORAGE_KEY, visitorId);
    }

    fetch("/api/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitor_id: visitorId }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (typeof data.total === "number") setTotal(data.total);
      })
      .catch(() => {});
  }, []);

  if (total === null) return null;

  return (
    <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-semibold text-slate-400 dark:text-slate-500 tracking-wide">
      <Users size={10} className="shrink-0" aria-hidden />
      {formatCount(total)} vizitatori
    </span>
  );
}
