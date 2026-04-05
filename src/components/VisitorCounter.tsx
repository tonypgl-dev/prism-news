"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { getStoredConsent, type CookieConsentData } from "./CookieConsent";

const STORAGE_KEY = "prisma_visitor_id";
/** Pentru cei fără analytics: ID în sessionStorage — un vizitator „unic” per sesiune de tab, fără cookie persistent. */
const SESSION_VISITOR_KEY = "prisma_visitor_session_id";

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function formatCount(n: number): string {
  return n.toLocaleString("ro-RO");
}

async function fetchTotalPublic(): Promise<number | null> {
  try {
    const res = await fetch("/api/visit", { method: "GET", cache: "no-store" });
    const data = (await res.json()) as { total?: number };
    return typeof data.total === "number" ? data.total : null;
  } catch {
    return null;
  }
}

function getOrCreateVisitorId(usePersistentStorage: boolean): string {
  if (usePersistentStorage) {
    let id = localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = generateUUID();
      localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  }
  let sid = sessionStorage.getItem(SESSION_VISITOR_KEY);
  if (!sid) {
    sid = generateUUID();
    sessionStorage.setItem(SESSION_VISITOR_KEY, sid);
  }
  return sid;
}

/** Înregistrează vizitatorul în DB. Analytics ON → localStorage (unic între vizite). Analytics OFF → sessionStorage (unic per sesiune tab). */
async function registerVisit(usePersistentStorage: boolean): Promise<number | null> {
  const visitorId = getOrCreateVisitorId(usePersistentStorage);
  try {
    const res = await fetch("/api/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitor_id: visitorId }),
    });
    const data = await res.json();
    return typeof data.total === "number" ? data.total : null;
  } catch {
    return null;
  }
}

export function VisitorCounter() {
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    function applyTotal(t: number | null) {
      if (!cancelled && t !== null) setTotal(t);
    }

    // Afișăm mereu totalul agregat (GET), fără a depinde de consimțământul pentru analytics.
    void fetchTotalPublic().then(applyTotal);

    const consent = getStoredConsent();
    if (consent !== null) {
      void registerVisit(consent.analytics).then(applyTotal);
    }

    function onConsent(e: Event) {
      const detail = (e as CustomEvent<CookieConsentData>).detail;
      void registerVisit(detail.analytics).then(applyTotal);
    }

    window.addEventListener("prisma:consent", onConsent);
    return () => {
      cancelled = true;
      window.removeEventListener("prisma:consent", onConsent);
    };
  }, []);

  if (total === null) return null;

  return (
    <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-semibold text-slate-400 dark:text-slate-500 tracking-wide">
      <Users size={10} className="shrink-0" aria-hidden />
      {formatCount(total)} vizitatori azi
    </span>
  );
}
