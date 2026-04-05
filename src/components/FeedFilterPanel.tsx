"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronRight, SlidersHorizontal, Check, Calendar } from "lucide-react";
import { CATEGORIES, REGIONS, type CategoryKey, type RegionKey } from "@/lib/categories";
import { DATE_RANGE_OPTIONS } from "@/hooks/useFeedFilter";
import type { FeedFilterHook } from "@/hooks/useFeedFilter";

interface Props {
  counts: Partial<Record<CategoryKey, number>>;
  regionCounts: Partial<Record<RegionKey, number>>;
  filterHook: FeedFilterHook;
}

export function FeedFilterPanel({ counts, regionCounts, filterHook }: Props) {
  const [open, setOpen] = useState(false);
  const [regionalExpanded, setRegionalExpanded] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const {
    filter,
    toggleCategory,
    toggleRegion,
    selectAll,
    setDateRange,
    isAllSelected,
    activeFilterCount,
  } = filterHook;

  // Închide la click în afară
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Dacă Regional e debifat, colapsăm și subcategoriile
  const regionalActive = filter.categories.includes("regional");

  return (
    <div className="relative" ref={panelRef}>
      {/* Buton trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`
          flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-widest
          border transition-all duration-200
          ${open
            ? "bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-slate-900"
            : activeFilterCount > 0
            ? "bg-slate-100 dark:bg-slate-800 border-slate-900 dark:border-white text-slate-900 dark:text-white"
            : "bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }
        `}
      >
        <SlidersHorizontal size={12} />
        <span>Feed</span>
        {activeFilterCount > 0 && (
          <span className={`text-[10px] font-bold px-1 py-0.5 rounded-sm ${
            open ? "bg-white/20 text-white dark:bg-black/20 dark:text-black" : "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
          }`}>
            {activeFilterCount}
          </span>
        )}
        <ChevronDown size={12} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute top-full mt-2 right-0 z-40 w-64 rounded-sm border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-2xl shadow-black/10 overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-3 h-10 border-b border-gray-100 dark:border-gray-800">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Filter Feed
            </span>
            {!isAllSelected && (
              <button
                onClick={selectAll}
                className="text-[10px] text-slate-900 dark:text-white font-black uppercase tracking-widest hover:underline decoration-2 underline-offset-2"
              >
                Reset
              </button>
            )}
          </div>

          {/* Interval de date */}
          <div className="px-3 py-3 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2 mb-3">
              <Calendar size={12} className="text-slate-400" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Timeframe
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {DATE_RANGE_OPTIONS.map((opt) => {
                const isActive = filter.dateRange === opt.key;
                return (
                  <button
                    key={opt.key}
                    onClick={() => setDateRange(opt.key)}
                    className={`px-2 py-2 rounded-sm text-[10px] font-bold uppercase tracking-widest text-center transition-colors ${
                      isActive
                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                        : "bg-slate-50 dark:bg-gray-900 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lista categorii */}
          <ul className="py-2 max-h-80 overflow-y-auto" role="listbox" aria-multiselectable="true">
            {CATEGORIES.map((cat) => {
              const isChecked = filter.categories.includes(cat.key);
              const count = counts[cat.key] ?? 0;
              const isRegional = cat.key === "regional";

              return (
                <li key={cat.key}>
                  <div
                    className={`flex items-center gap-3 px-4 py-2 cursor-pointer select-none transition-colors
                      ${isChecked
                        ? "hover:bg-slate-50 dark:hover:bg-gray-900"
                        : "opacity-40 hover:opacity-100 hover:bg-slate-50 dark:hover:bg-gray-900"
                      }
                    `}
                    role="option"
                    aria-selected={isChecked}
                    onClick={() => toggleCategory(cat.key)}
                  >
                    {/* Checkbox */}
                    <div className={`w-3 h-3 rounded-sm flex items-center justify-center shrink-0 border transition-colors ${
                      isChecked
                        ? "bg-slate-900 border-slate-900 dark:bg-white dark:border-white"
                        : "border-gray-300 dark:border-gray-700"
                    }`}>
                      {isChecked && <Check size={8} className="text-white dark:text-slate-900" strokeWidth={4} />}
                    </div>

                    {/* Label */}
                    <span className="flex-1 text-[11px] font-bold uppercase tracking-widest text-slate-900 dark:text-slate-100">
                      {cat.label}
                    </span>

                    {/* Count */}
                    {count > 0 && (
                      <span className="text-[10px] text-slate-400 dark:text-slate-600 font-bold">
                        {count}
                      </span>
                    )}
                  </div>

                  {/* Subcategorii regionale */}
                  {isRegional && regionalActive && regionalExpanded && (
                    <ul className="pl-8 pb-2 border-l border-slate-200 dark:border-slate-800 ml-5 space-y-1 mt-1">
                      {REGIONS.map((region) => {
                        const isRegionChecked = filter.regions.includes(region.key);
                        const rCount = regionCounts[region.key] ?? 0;
                        return (
                          <li
                            key={region.key}
                            className={`flex items-center gap-2 px-2 py-1 cursor-pointer select-none transition-colors
                              ${isRegionChecked
                                ? "text-slate-900 dark:text-white font-bold"
                                : "text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400"
                              }
                            `}
                            role="option"
                            aria-selected={isRegionChecked}
                            onClick={() => toggleRegion(region.key)}
                          >
                            <div className={`w-2.5 h-2.5 rounded-sm flex items-center justify-center shrink-0 border transition-colors ${
                              isRegionChecked
                                ? "bg-slate-900 border-slate-900 dark:bg-white dark:border-white"
                                : "border-gray-300 dark:border-gray-700"
                            }`}>
                              {isRegionChecked && <Check size={7} className="text-white dark:text-slate-900" strokeWidth={4} />}
                            </div>
                            <span className="flex-1 text-[10px] uppercase tracking-widest">
                              {region.label}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>

          {/* Footer cu buton Aplică */}
          <div className="border-t border-gray-100 dark:border-gray-800 p-3">
            <button
              onClick={() => setOpen(false)}
              className="w-full py-3 rounded-sm bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all"
            >
              Apply Filter
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
