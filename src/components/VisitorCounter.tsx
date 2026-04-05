"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { getStoredConsent, type CookieConsentData } from "./CookieConsent";

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

async function registerVisit(): Promise<number | null> {
  let visitorId = localStorage.getItem(STORAGE_KEY);
  if (!visitorId) {
    visitorId = generateUUID();
    localStorage.setItem(STORAGE_KEY, visitorId);
  }
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
    const consent = getStoredConsent();

    if (consent?.analytics) {
      // Consimțământ deja dat → înregistrează imediat
      registerVisit().then((t) => { if (t !== null) setTotal(t); });
      return;
    }

    if (consent !== null) {
      // Consimțământ dat, dar analytics refuzat → nu afișa nimic
      return;
    }

    // Nicio decizie încă → așteptăm evenimentul de consent
    function onConsent(e: Event) {
      const detail = (e as CustomEvent<CookieConsentData>).detail;
      if (detail.analytics) {
        registerVisit().then((t) => { if (t !== null) setTotal(t); });
      }
    }

    window.addEventListener("prisma:consent", onConsent);
    return () => window.removeEventListener("prisma:consent", onConsent);
  }, []);

  if (total === null) return null;

  return (
    <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-semibold text-slate-400 dark:text-slate-500 tracking-wide">
      <Users size={10} className="shrink-0" aria-hidden />
      {formatCount(total)} vizitatori azi
    </span>
  );
}
