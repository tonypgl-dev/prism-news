"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronRight, SlidersHorizontal, Check } from "lucide-react";
import { CATEGORIES, REGIONS, type CategoryKey, type RegionKey } from "@/lib/categories";
import { useFeedFilter } from "@/hooks/useFeedFilter";

interface Props {
  /** Numărul de articole per categorie — calculat în NewsPageClient */
  counts: Partial<Record<CategoryKey, number>>;
  regionCounts: Partial<Record<RegionKey, number>>;
}

export function FeedFilterPanel({ counts, regionCounts }: Props) {
  const [open, setOpen] = useState(false);
  const [regionalExpanded, setRegionalExpanded] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const {
    filter,
    toggleCategory,
    toggleRegion,
    selectAll,
    isAllSelected,
    activeFilterCount,
  } = useFeedFilter();

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
          flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
          border transition-all duration-200
          ${open
            ? "bg-purple-600 border-purple-600 text-white"
            : activeFilterCount > 0
            ? "bg-amber-50 dark:bg-amber-900/20 border-amber-400 dark:border-amber-600 text-amber-700 dark:text-amber-400"
            : "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
          }
        `}
      >
        <SlidersHorizontal size={12} />
        <span>Feed</span>
        {activeFilterCount > 0 && (
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
            open ? "bg-white/20 text-white" : "bg-amber-500 text-white"
          }`}>
            -{activeFilterCount}
          </span>
        )}
        <ChevronDown size={11} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute top-full mt-1.5 right-0 z-40 w-64 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-gray-800">
            <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Filtrează feed-ul
            </span>
            {!isAllSelected && (
              <button
                onClick={selectAll}
                className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold hover:underline"
              >
                Selectează toate
              </button>
            )}
          </div>

          {/* Lista categorii */}
          <ul className="py-1 max-h-80 overflow-y-auto" role="listbox" aria-multiselectable="true">
            {CATEGORIES.map((cat) => {
              const isChecked = filter.categories.includes(cat.key);
              const count = counts[cat.key] ?? 0;
              const isRegional = cat.key === "regional";

              return (
                <li key={cat.key}>
                  <div
                    className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer select-none transition-colors
                      ${isChecked
                        ? "hover:bg-gray-50 dark:hover:bg-gray-800"
                        : "opacity-50 hover:opacity-70 hover:bg-gray-50 dark:hover:bg-gray-800"
                      }
                    `}
                    role="option"
                    aria-selected={isChecked}
                    onClick={() => toggleCategory(cat.key)}
                  >
                    {/* Checkbox */}
                    <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-colors ${
                      isChecked
                        ? "bg-purple-600 border-purple-600"
                        : "border-gray-300 dark:border-gray-600"
                    }`}>
                      {isChecked && <Check size={10} className="text-white" strokeWidth={3} />}
                    </div>

                    {/* Emoji + label */}
                    <span className="text-sm">{cat.emoji}</span>
                    <span className="flex-1 text-xs font-medium text-gray-700 dark:text-gray-200">
                      {cat.label}
                    </span>

                    {/* Count */}
                    {count > 0 && (
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                        {count}
                      </span>
                    )}

                    {/* Expand arrow pentru Regional */}
                    {isRegional && isChecked && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRegionalExpanded((v) => !v);
                        }}
                        className="ml-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        aria-label={regionalExpanded ? "Ascunde regiuni" : "Arată regiuni"}
                      >
                        <ChevronRight
                          size={13}
                          className={`transition-transform duration-200 ${regionalExpanded ? "rotate-90" : ""}`}
                        />
                      </button>
                    )}
                  </div>

                  {/* Subcategorii regionale */}
                  {isRegional && regionalActive && regionalExpanded && (
                    <ul className="pl-7 pb-1 border-l-2 border-purple-100 dark:border-purple-900/40 ml-5">
                      {REGIONS.map((region) => {
                        const isRegionChecked = filter.regions.includes(region.key);
                        const rCount = regionCounts[region.key] ?? 0;
                        return (
                          <li
                            key={region.key}
                            className={`flex items-center gap-2 px-2 py-1 cursor-pointer select-none rounded transition-colors
                              ${isRegionChecked
                                ? "hover:bg-gray-50 dark:hover:bg-gray-800"
                                : "opacity-50 hover:opacity-70 hover:bg-gray-50 dark:hover:bg-gray-800"
                              }
                            `}
                            role="option"
                            aria-selected={isRegionChecked}
                            onClick={() => toggleRegion(region.key)}
                          >
                            <div className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 border transition-colors ${
                              isRegionChecked
                                ? "bg-purple-500 border-purple-500"
                                : "border-gray-300 dark:border-gray-600"
                            }`}>
                              {isRegionChecked && <Check size={9} className="text-white" strokeWidth={3} />}
                            </div>
                            <span className="flex-1 text-[11px] text-gray-600 dark:text-gray-300">
                              {region.label}
                            </span>
                            {rCount > 0 && (
                              <span className="text-[10px] text-gray-400 dark:text-gray-500">
                                {rCount}
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
