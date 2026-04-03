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
          <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-36 flex items-center gap-4">

            {/* Logo */}
            <a href="/" className="relative shrink-0 inline-block logo-scale-mobile">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Prisma News" style={{ height: "110px", width: "auto", display: "block" }} />
              {/* Punct de lumină radiant */}
              <div
                className="absolute pointer-events-none"
                style={{ left: "calc(38% - 1px)", top: "calc(42% + 8px)" }}
              >
                {/* Raze lungi — cruce de lumină */}
                <div style={{
                  position: "absolute",
                  transform: "translate(-50%, -50%)",
                  width: "120px",
                  height: "1px",
                  background: "linear-gradient(to right, transparent 0%, rgba(255,255,255,0.5) 30%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.5) 70%, transparent 100%)",
                  filter: "blur(0.5px)",
                }} />
                <div style={{
                  position: "absolute",
                  transform: "translate(-50%, -50%)",
                  width: "1px",
                  height: "100px",
                  background: "linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.4) 30%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0.4) 70%, transparent 100%)",
                  filter: "blur(0.5px)",
                }} />
                {/* Glow exterior mare — fade spre margini */}
                <div style={{
                  position: "absolute",
                  transform: "translate(-50%, -50%)",
                  width: "120px",
                  height: "120px",
                  borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.18) 25%, rgba(255,255,255,0.03) 50%, transparent 65%)",
                  filter: "blur(8px)",
                }} />
                {/* Glow mijlociu */}
                <div style={{
                  position: "absolute",
                  transform: "translate(-50%, -50%)",
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0.08) 60%, transparent 100%)",
                  filter: "blur(5px)",
                }} />
                {/* Nucleul mic */}
                <div style={{
                  position: "absolute",
                  transform: "translate(-50%, -50%)",
                  width: "3px",
                  height: "3px",
                  borderRadius: "50%",
                  background: "white",
                  boxShadow: "0 0 3px 1px rgba(255,255,255,0.8)",
                }} />
              </div>

              {/* PRISMA — perspectivă 3D */}
              <div className="absolute pointer-events-none" style={{ top: "-8px", right: "7px", perspective: "200px", perspectiveOrigin: "right center" }}>
                <span
                  className="text-[63px] font-black uppercase tracking-tight"
                  style={{
                    fontFamily: "var(--font-barlow), sans-serif",
                    lineHeight: 1,
                    background: "linear-gradient(to right, #1a3a5c, #3a9fd4)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    transform: "rotateY(-38deg)",
                    display: "inline-block",
                    transformOrigin: "right center",
                  }}
                >
                  PRISMA
                </span>
              </div>
              {/* NEWS — identic cu PRISMA */}
              <div className="absolute pointer-events-none" style={{ top: "45px", right: "7px", perspective: "100px", perspectiveOrigin: "right center" }}>
                <span
                  className="text-[40px] font-black uppercase tracking-tight"
                  style={{
                    fontFamily: "var(--font-barlow), sans-serif",
                    lineHeight: 1,
                    color: "#8fa3b1",
                    transform: "rotateY(-38deg) rotate(10deg)",
                    display: "inline-block",
                    transformOrigin: "right center",
                    textShadow: `
                      -2px -2px 0 rgba(0,0,0,0.85),
                       2px -2px 0 rgba(0,0,0,0.85),
                      -2px  2px 0 rgba(0,0,0,0.85),
                       2px  2px 0 rgba(0,0,0,0.85),
                      -2px  0   0 rgba(0,0,0,0.85),
                       2px  0   0 rgba(0,0,0,0.85),
                       0   -2px 0 rgba(0,0,0,0.85),
                       0    2px 0 rgba(0,0,0,0.85)
                    `,
                  }}
                >
                  NEWS
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
