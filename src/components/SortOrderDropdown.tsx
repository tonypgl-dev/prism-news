"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Clock, Flame, Sparkles, Check } from "lucide-react";

export type SortOrder = "recent" | "popular" | "recommended";

const OPTIONS: { id: SortOrder; label: string; Icon: typeof Clock }[] = [
  { id: "recent", label: "Recente", Icon: Clock },
  { id: "popular", label: "Populare", Icon: Flame },
  { id: "recommended", label: "Recomandate", Icon: Sparkles },
];

interface Props {
  value: SortOrder;
  onChange: (next: SortOrder) => void;
}

export function SortOrderDropdown({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const current = OPTIONS.find((o) => o.id === value) ?? OPTIONS[0];
  const CurrentIcon = current.Icon;

  return (
    <div className="relative shrink-0" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Sortare feed"
        className={`
          flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-widest
          border transition-all duration-200
          ${open
            ? "bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-slate-900"
            : "bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }
        `}
      >
        <CurrentIcon size={12} />
        <span>{current.label}</span>
        <ChevronDown size={12} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          className="absolute top-full left-0 mt-2 z-40 min-w-[11rem] rounded-sm border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-2xl shadow-black/10 overflow-hidden"
          role="listbox"
        >
          <div className="px-3 h-9 flex items-center border-b border-gray-100 dark:border-gray-800">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Sortare
            </span>
          </div>
          <ul className="py-1">
            {OPTIONS.map(({ id, label, Icon }) => {
              const selected = id === value;
              return (
                <li key={id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => {
                      onChange(id);
                      setOpen(false);
                    }}
                    className={`
                      w-full flex items-center gap-2 px-3 py-2 text-left text-xs font-semibold transition-colors
                      ${selected
                        ? "bg-slate-100 dark:bg-gray-800 text-slate-900 dark:text-slate-100"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-gray-900/80 hover:text-slate-900 dark:hover:text-slate-200"
                      }
                    `}
                  >
                    <Icon size={14} className="shrink-0 opacity-80" />
                    <span className="flex-1">{label}</span>
                    {selected ? <Check size={14} className="shrink-0 text-slate-900 dark:text-white" /> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
