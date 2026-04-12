"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Article } from "@/types";
import { useSettings } from "@/hooks/useSettings";
import { getCategoryLabel, CATEGORY_MAP } from "@/lib/editorial-categories";

interface Props {
  article: Article;
}

/** Primul <p> din HTML editorial — text simplu pentru preview. */
function firstParagraphText(html: string | null | undefined): string {
  if (!html) return "";
  const m = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  if (!m) return "";
  return m[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

export function EditorialCard({ article }: Props) {
  const { settings } = useSettings();
  const isSerif = settings.titleFont === "serif";
  const [isExpanded, setIsExpanded] = useState(false);

  const cat = article.category ? CATEGORY_MAP[article.category] : null;
  const accentColor = cat?.accent ?? "#C8963E";
  const categoryLabel = article.category ? getCategoryLabel(article.category) : null;

  const aiSummary =
    article.ai_pre_summary ??
    article.ai_summary ??
    article.summary ??
    "";

  const previewFromArticle = useMemo(
    () => firstParagraphText(article.content_html),
    [article.content_html]
  );

  const toggleExpanded = () => setIsExpanded((v) => !v);

  return (
    <div
      tabIndex={0}
      aria-expanded={isExpanded}
      aria-label={isExpanded ? "Restrânge cardul editorial" : "Extinde cardul editorial"}
      className={`rounded-sm border transition-all duration-300 overflow-hidden cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--accent)] ${
        isExpanded ? "bg-slate-50/80 dark:bg-slate-900/45" : ""
      }`}
      style={{
        borderColor: `${accentColor}40`,
        ...(!isExpanded ? { backgroundColor: `${accentColor}06` } : {}),
        ...(isExpanded ? { boxShadow: `inset 0 1px 0 0 ${accentColor}22` } : {}),
      }}
      onClick={toggleExpanded}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleExpanded();
        }
      }}
    >
      <div className="flex gap-0 min-h-[96px]">
        <div
          className="w-1 shrink-0"
          style={{ background: `linear-gradient(to bottom, ${accentColor}cc, ${accentColor})` }}
        />

        <div className="flex-1 px-4 py-3.5 min-w-0 flex flex-col">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <span
                className="text-[9px] font-black uppercase tracking-[2.5px]"
                style={{ color: accentColor }}
              >
                ✦ Prism News
              </span>
              {categoryLabel && (
                <>
                  <span className="text-[10px] opacity-40">·</span>
                  <span
                    className="text-[9px] font-semibold uppercase tracking-[2px] opacity-70"
                    style={{ color: accentColor }}
                  >
                    {categoryLabel}
                  </span>
                </>
              )}
            </div>
            <span
              className="shrink-0 p-1 rounded-sm text-slate-500 pointer-events-none"
              aria-hidden
            >
              <motion.span
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.25 }}
                className="inline-flex"
              >
                <ChevronDown size={18} strokeWidth={2.25} />
              </motion.span>
            </span>
          </div>

          <h3
            className={`text-sm font-bold leading-snug text-slate-900 dark:text-slate-100 mb-2 ${
              isSerif ? "font-serif" : ""
            }`}
          >
            {article.title}
          </h3>

          {/* Sinteză AI — mereu vizibilă; extinsă = stil distinct, fără line-clamp */}
          {aiSummary && (
            <p
              className={`text-xs leading-relaxed text-slate-600 dark:text-slate-300 ${
                isExpanded
                  ? "border-l-2 pl-3 py-1 italic text-slate-700 dark:text-slate-200"
                  : "line-clamp-2"
              }`}
              style={
                isExpanded
                  ? { borderColor: `${accentColor}99` }
                  : undefined
              }
            >
              {aiSummary}
            </p>
          )}

          <AnimatePresence initial={false}>
            {isExpanded && (
              <motion.div
                key="editorial-expand"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div className="pt-3 space-y-3">
                  {previewFromArticle ? (
                    <div className="relative max-h-[7.5rem] overflow-hidden rounded-sm">
                      <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400 pr-1">
                        {previewFromArticle}
                      </p>
                      <div
                        className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/85 to-transparent"
                        aria-hidden
                      />
                    </div>
                  ) : null}

                  <Link
                    href={`/editorial/${article.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex w-full sm:w-auto items-center justify-center px-4 py-2.5 rounded-sm text-[11px] font-bold uppercase tracking-widest text-white shadow-sm transition-opacity hover:opacity-90 cursor-pointer"
                    style={{ backgroundColor: accentColor }}
                  >
                    Citește tot articolul
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {article.image_url && (
          <div className="relative w-20 h-24 sm:w-28 sm:h-28 shrink-0 overflow-hidden rounded-r-sm bg-slate-200/30 dark:bg-slate-800/50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={article.image_url}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-90"
            />
          </div>
        )}
      </div>
    </div>
  );
}
