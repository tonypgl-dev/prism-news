"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Article } from "@/types";
import { useSettings } from "@/hooks/useSettings";
import { getCategoryLabel, CATEGORY_MAP } from "@/lib/editorial-categories";

interface Props {
  article: Article;
}

export function EditorialCard({ article }: Props) {
  const { settings } = useSettings();
  const isSerif = settings.titleFont === "serif";

  const cat = article.category ? CATEGORY_MAP[article.category] : null;
  const accentColor = cat?.accent ?? "#C8963E";
  const categoryLabel = article.category ? getCategoryLabel(article.category) : null;

  const teaser =
    article.ai_pre_summary ??
    article.ai_summary ??
    article.summary ??
    "";

  return (
    <Link
      href={`/editorial/${article.id}`}
      className="group block rounded-sm border transition-all duration-200 overflow-hidden"
      style={{
        borderColor: `${accentColor}40`,
        backgroundColor: `${accentColor}06`,
      }}
    >
      <div className="flex gap-0 min-h-[96px]">
        {/* Accent bar — culoare per categorie */}
        <div
          className="w-1 shrink-0"
          style={{ background: `linear-gradient(to bottom, ${accentColor}cc, ${accentColor})` }}
        />

        <div className="flex-1 px-4 py-3.5 min-w-0">
          {/* Category + badge */}
          <div className="flex items-center gap-2 mb-2">
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

          {/* Title */}
          <h3
            className={`text-sm font-bold leading-snug text-slate-900 dark:text-slate-100 mb-1.5 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors ${
              isSerif ? "font-serif" : ""
            }`}
          >
            {article.title}
          </h3>

          {/* Teaser */}
          {teaser && (
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
              {teaser}
            </p>
          )}

          {/* CTA */}
          <div
            className="flex items-center gap-1 mt-2.5 text-[10px] font-semibold uppercase tracking-widest group-hover:gap-2 transition-all"
            style={{ color: accentColor }}
          >
            <span>Citește articolul</span>
            <ArrowRight size={10} />
          </div>
        </div>

        {/* Thumbnail — același URL ca imaginea de copertă de pe /editorial/[id] */}
        {article.image_url && (
          <div className="relative w-20 h-24 sm:w-28 sm:h-28 shrink-0 overflow-hidden rounded-r-sm bg-slate-200/30 dark:bg-slate-800/50">
            {/* eslint-disable-next-line @next/next/no-img-element -- URL dinamic din DB */}
            <img
              src={article.image_url}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-opacity"
            />
          </div>
        )}
      </div>
    </Link>
  );
}
