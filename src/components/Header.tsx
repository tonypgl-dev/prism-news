"use client";

import { useState, useCallback } from "react";
import { ChevronDown, Search, SlidersHorizontal } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { BreakingTicker } from "./BreakingTicker";
import { SettingsPanel } from "./SettingsPanel";
import { BREAKING_NEWS } from "@/lib/mock-data";

const CATEGORIES = ["Politică", "Economie", "Energie", "Social", "Extern"];

interface HeaderProps {
  tickerItems?: string[];
}

export function Header({ tickerItems }: HeaderProps) {
  /** Stare panou setări */
  const [settingsOpen, setSettingsOpen] = useState(false);


  const openSettings = useCallback(() => setSettingsOpen(true), []);
  const closeSettings = useCallback(() => setSettingsOpen(false), []);

  return (
    <>
      <header className="w-full">
        {/* ── Nav principal ──────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-screen-xl mx-auto px-4 sm:px-6 min-h-32 py-2 flex items-center gap-4">

            {/* Logo */}
            <a href="/" className="flex items-center gap-2.5 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Prisma News" className="h-10 w-auto" />
              <div className="flex flex-col leading-none">
                <span
                  className="text-[22px] font-extrabold uppercase tracking-tight text-[#1a2f5a] dark:text-white"
                  style={{ fontFamily: "var(--font-barlow), sans-serif", lineHeight: 1 }}
                >
                  PRISMA <span className="text-[#1a2f5a] dark:text-slate-300 font-bold">NEWS</span>
                </span>
                <span
                  className="text-[11px] text-slate-400 dark:text-slate-500 tracking-wide"
                  style={{ fontFamily: "var(--font-barlow), sans-serif" }}
                >
                  prisma-news.ro
                </span>
              </div>
            </a>

            {/* Category selector — centru */}
            <div className="flex-1 flex items-center justify-center">
              <div className="hidden sm:flex items-center gap-1">
                {CATEGORIES.map((cat, i) => (
                  <button
                    key={cat}
                    className={`
                      px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                      ${
                        i === 0
                          ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                      }
                    `}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              {/* Mobile: dropdown */}
              <div className="sm:hidden flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-full px-3 py-1.5">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Politică
                </span>
                <ChevronDown size={14} className="text-gray-500" />
              </div>
            </div>

            {/* Acțiuni dreapta */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Căutare */}
              <button
                aria-label="Caută"
                className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <Search size={16} className="text-gray-600 dark:text-gray-400" />
              </button>

              {/* Theme toggle (existent, nemodificat) */}
              <ThemeToggle />

              {/* Buton Setări */}
              <button
                onClick={openSettings}
                aria-label="Deschide setările"
                aria-expanded={settingsOpen}
                aria-haspopup="dialog"
                className={`
                  flex items-center justify-center w-9 h-9 rounded-full transition-colors
                  ${
                    settingsOpen
                      ? "bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400"
                      : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                  }
                `}
              >
                <SlidersHorizontal size={16} />
              </button>
            </div>
          </div>
        </div>

      </header>

      {/* Breaking news ticker — sticky independent */}
      <BreakingTicker items={tickerItems && tickerItems.length > 0 ? tickerItems : BREAKING_NEWS} />

      {/* Panou setări — montat via Portal în document.body */}
      <SettingsPanel
        isOpen={settingsOpen}
        onClose={closeSettings}
      />
    </>
  );
}
