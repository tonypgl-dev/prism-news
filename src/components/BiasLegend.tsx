"use client";

import { Info } from "lucide-react";
import { useEffect, useRef } from "react";
import { useMotionValue, animate } from "framer-motion";
import { useSettings } from "@/hooks/useSettings";
import type { BiasFilter } from "./SpectrumSection";

// Unghi ac per filtru (față de verticală, în grade)
// 9 o'clock = -90°, 12 o'clock = 0°, 3 o'clock = +90°
const NEEDLE_ANGLE: Record<BiasFilter, number> = {
  all:    0,
  left:   -90,
  center: 0,
  right:  90,
};

interface Props {
  biasFilter: BiasFilter;
  onBiasFilterChange: (f: BiasFilter) => void;
}

export function BiasLegend({ biasFilter, onBiasFilterChange }: Props) {
  const { biasLabels } = useSettings();
  const needleAngle = NEEDLE_ANGLE[biasFilter];

  // Animație SVG nativă: bypass CSS transform-origin
  const rotation = useMotionValue(0);
  const gRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const unsub = rotation.on("change", (v) => {
      gRef.current?.setAttribute("transform", `translate(60, 66) rotate(${v})`);
    });
    return unsub;
  }, [rotation]);

  useEffect(() => {
    const controls = animate(rotation, needleAngle, {
      type: "spring",
      stiffness: 55,
      damping: 14,
    });
    return controls.stop;
  }, [needleAngle]);

  return (
    <div className="flex flex-wrap items-center gap-4 px-4 py-3 bg-[var(--card)] dark:bg-gray-900 rounded-sm border border-slate-200 dark:border-gray-700 shadow-sm shadow-slate-900/[0.04] dark:shadow-none">
      <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-gray-400 shrink-0">
        <Info size={12} />
        <span className="font-medium">Spectrul editorial:</span>
      </div>

      {/* Gauge + butoane */}
      <div className="flex flex-col items-center gap-2 shrink-0">

        {/* Semicerc SVG */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-blue-500">{biasLabels.left}</span>

          <svg
            width="120"
            height="70"
            viewBox="0 0 120 70"
            aria-label="Spectru editorial"
          >
            <defs>
              <linearGradient id="gauge-grad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%"   stopColor="#3b82f6" />
                <stop offset="50%"  stopColor="#eab308" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
            </defs>

            {/* Track fundal */}
            <path
              d="M 10 66 A 50 50 0 0 1 110 66"
              stroke="#e5e7eb"
              strokeWidth="9"
              fill="none"
              strokeLinecap="round"
              className="dark:stroke-gray-700"
            />
            {/* Track gradient */}
            <path
              d="M 10 66 A 50 50 0 0 1 110 66"
              stroke="url(#gauge-grad)"
              strokeWidth="9"
              fill="none"
              strokeLinecap="round"
            />

            {/* Tick-uri */}
            <line x1="25" y1="31" x2="30" y2="36" stroke="#9ca3af" strokeWidth="1"   strokeLinecap="round" />
            <line x1="60" y1="15" x2="60" y2="23" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="95" y1="31" x2="90" y2="36" stroke="#9ca3af" strokeWidth="1"   strokeLinecap="round" />

            {/* Ac animat via SVG transform nativ — pivot (0,0) local = (60,66) în SVG */}
            <g ref={gRef} transform="translate(60, 66) rotate(0)">
              {/* Corp fusiform — vârf sus (0,-42), pivot jos (0,0) */}
              <path
                d="M 0,-42 C 1.8,-28 3.2,-12 3.8,0 L 0,5 L -3.8,0 C -3.2,-12 -1.8,-28 0,-42 Z"
                fill="#1e293b"
                className="dark:fill-slate-100"
              />
              {/* Reflex */}
              <path
                d="M -0.8,-39 C -0.7,-26 -0.5,-12 -0.3,0"
                stroke="white" strokeWidth="1" strokeOpacity="0.35"
                strokeLinecap="round" fill="none"
              />
              {/* Pivot exterior */}
              <circle cx="0" cy="0" r="6" fill="#1e293b" className="dark:fill-slate-100" />
              {/* Pivot interior */}
              <circle cx="0" cy="0" r="2.8" fill="white" className="dark:fill-gray-900" />
            </g>
          </svg>

          <span className="text-[11px] font-bold text-red-500">{biasLabels.right}</span>
        </div>

        {/* Butoane filtru */}
        <div className="flex items-center gap-1.5">
          {/* Toate */}
          <button
            onClick={() => onBiasFilterChange("all")}
            aria-pressed={biasFilter === "all"}
            className={`
              px-3 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all duration-200
              focus:outline-none
              ${biasFilter === "all"
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
                : "bg-slate-50 dark:bg-gray-800 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white"}
            `}
          >
            All
          </button>

          {/* Stânga */}
          <button
            onClick={() => onBiasFilterChange("left")}
            aria-pressed={biasFilter === "left"}
            className={`
              inline-flex items-center gap-2 px-3 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all duration-200
              focus:outline-none
              ${biasFilter === "left"
                ? "bg-white dark:bg-gray-800 text-slate-900 dark:text-white border-b-2 border-blue-600"
                : "bg-slate-50 dark:bg-gray-900 text-slate-400 dark:text-slate-600 hover:text-slate-900 dark:hover:text-white"}
            `}
          >
            <div className="w-1 h-3 bg-blue-600" />
            {biasLabels.left}
          </button>

          {/* Centru */}
          <button
            onClick={() => onBiasFilterChange("center")}
            aria-pressed={biasFilter === "center"}
            className={`
              inline-flex items-center gap-2 px-3 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all duration-200
              focus:outline-none
              ${biasFilter === "center"
                ? "bg-white dark:bg-gray-800 text-slate-900 dark:text-white border-b-2 border-slate-500"
                : "bg-slate-50 dark:bg-gray-900 text-slate-400 dark:text-slate-600 hover:text-slate-900 dark:hover:text-white"}
            `}
          >
            <div className="w-1 h-3 bg-slate-500" />
            {biasLabels.center}
          </button>

          {/* Dreapta */}
          <button
            onClick={() => onBiasFilterChange("right")}
            aria-pressed={biasFilter === "right"}
            className={`
              inline-flex items-center gap-2 px-3 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all duration-200
              focus:outline-none
              ${biasFilter === "right"
                ? "bg-white dark:bg-gray-800 text-slate-900 dark:text-white border-b-2 border-red-600"
                : "bg-slate-50 dark:bg-gray-900 text-slate-400 dark:text-slate-600 hover:text-slate-900 dark:hover:text-white"}
            `}
          >
            <div className="w-1 h-3 bg-red-600" />
            {biasLabels.right}
          </button>
        </div>
      </div>

    </div>
  );
}
