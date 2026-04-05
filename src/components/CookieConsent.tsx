"use client";

import { useState, useEffect } from "react";
import { Shield, BarChart2, SlidersHorizontal, ChevronDown, ChevronUp, X } from "lucide-react";

export type CookieConsentData = {
  analytics: boolean;
  personalization: boolean;
  savedAt: number;
};

export const CONSENT_KEY = "prisma_cookie_consent";

export function getStoredConsent(): CookieConsentData | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    return raw ? (JSON.parse(raw) as CookieConsentData) : null;
  } catch {
    return null;
  }
}

function saveConsent(data: Omit<CookieConsentData, "savedAt">) {
  const full: CookieConsentData = { ...data, savedAt: Date.now() };
  localStorage.setItem(CONSENT_KEY, JSON.stringify(full));
  window.dispatchEvent(new CustomEvent("prisma:consent", { detail: full }));
}

// ── Toggle switch ─────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange?: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={`
        relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200
        focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 dark:focus-visible:ring-white
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        ${checked
          ? "bg-slate-900 dark:bg-white"
          : "bg-slate-200 dark:bg-slate-700"
        }
      `}
    >
      <span
        className={`
          inline-block h-3.5 w-3.5 rounded-full transition-transform duration-200
          ${checked
            ? "translate-x-[18px] bg-white dark:bg-slate-900"
            : "translate-x-[3px] bg-white dark:bg-slate-400"
          }
        `}
      />
    </button>
  );
}

// ── Componentă principală ─────────────────────────────────────────

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [personalization, setPersonalization] = useState(true);

  useEffect(() => {
    const consent = getStoredConsent();
    if (!consent) setVisible(true);
  }, []);

  if (!visible) return null;

  function acceptAll() {
    saveConsent({ analytics: true, personalization: true });
    setVisible(false);
  }

  function rejectAll() {
    saveConsent({ analytics: false, personalization: false });
    setVisible(false);
  }

  function saveCustom() {
    saveConsent({ analytics, personalization });
    setVisible(false);
  }

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Consimțământ cookies"
      className="fixed bottom-0 left-0 right-0 z-[100] border-t border-gray-200 dark:border-gray-800
                 bg-white dark:bg-gray-950 shadow-2xl shadow-black/20"
    >
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-4">

        {/* ── Rând principal ── */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <Shield size={16} className="text-slate-900 dark:text-white shrink-0 mt-0.5" />
            <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">
              Această pagină folosește cookies pentru a-ți oferi o experiență personalizată și pentru
              a analiza traficul. Poți alege ce tipuri de cookies accepți.{" "}
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="inline-flex items-center gap-0.5 text-slate-900 dark:text-white font-bold underline underline-offset-2 hover:opacity-70 transition-opacity"
              >
                Personalizează
                {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              </button>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              onClick={rejectAll}
              className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest
                         border border-gray-200 dark:border-gray-700
                         text-slate-600 dark:text-slate-400
                         hover:border-slate-400 dark:hover:border-slate-500
                         hover:text-slate-900 dark:hover:text-white
                         transition-colors rounded-sm"
            >
              Respinge toate
            </button>
            <button
              onClick={acceptAll}
              className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest
                         bg-slate-900 dark:bg-white
                         text-white dark:text-slate-900
                         hover:opacity-90 transition-opacity rounded-sm"
            >
              Acceptă toate
            </button>
            <button
              onClick={() => setVisible(false)}
              aria-label="Închide"
              className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* ── Panoul expandat de personalizare ── */}
        {expanded && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 grid sm:grid-cols-3 gap-3">

            {/* Esențiale — mereu active */}
            <div className="flex items-start justify-between gap-3 p-3 rounded-sm bg-slate-50 dark:bg-gray-900 border border-slate-100 dark:border-gray-800">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <Shield size={12} className="text-slate-900 dark:text-white shrink-0" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">
                    Esențiale
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">
                    · mereu active
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Necesare pentru funcționarea site-ului: preferințe temă, font, setări interfață.
                </p>
              </div>
              <Toggle checked={true} disabled />
            </div>

            {/* Analitice — opțional */}
            <div className="flex items-start justify-between gap-3 p-3 rounded-sm bg-slate-50 dark:bg-gray-900 border border-slate-100 dark:border-gray-800">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <BarChart2 size={12} className="text-slate-900 dark:text-white shrink-0" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">
                    Analitice
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Contorizarea vizitatorilor unici. Fără date personale — doar un ID anonim per dispozitiv.
                </p>
              </div>
              <Toggle checked={analytics} onChange={setAnalytics} />
            </div>

            {/* Personalizare — opțional */}
            <div className="flex items-start justify-between gap-3 p-3 rounded-sm bg-slate-50 dark:bg-gray-900 border border-slate-100 dark:border-gray-800">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <SlidersHorizontal size={12} className="text-slate-900 dark:text-white shrink-0" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">
                    Personalizare
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Istoricul articolelor citite pentru recomandări personalizate în feed.
                </p>
              </div>
              <Toggle checked={personalization} onChange={setPersonalization} />
            </div>

            <div className="sm:col-span-3 flex justify-end">
              <button
                onClick={saveCustom}
                className="px-4 py-1.5 text-[10px] font-black uppercase tracking-widest
                           bg-slate-900 dark:bg-white text-white dark:text-slate-900
                           hover:opacity-90 transition-opacity rounded-sm"
              >
                Salvează preferințele
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
