"use client";

import { ExternalLink, Clock, ImageOff } from "lucide-react";
import { motion } from "framer-motion";
import type { Article, Bias } from "@/types";
import { timeAgo, BIAS_COLORS } from "@/lib/utils";
import { useSettings } from "@/hooks/useSettings";
import { SourcePopover } from "./SourcePopover";

interface Props {
  article: Article;
  index?: number;
}

export function NewsCard({ article, index = 0 }: Props) {
  const colors = BIAS_COLORS[article.bias];
  const { settings } = useSettings();

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: "easeOut" }}
      className={`
        flex flex-col rounded-sm border overflow-hidden
        bg-[var(--card)] border-gray-200 dark:border-gray-800
        hover:border-slate-400 dark:hover:border-slate-600
        transition-colors duration-200 h-full
      `}
    >
      {/* Thumbnail */}
      <a
        href={article.link}
        target="_blank"
        rel="noopener noreferrer"
        className="block relative aspect-[16/9] bg-gray-100 dark:bg-gray-900 overflow-hidden"
        tabIndex={-1}
        aria-hidden="true"
      >
        {article.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.image_url}
            alt={article.title}
            className="w-full h-full object-cover grayscale-[0.2] hover:grayscale-0 transition-all duration-500 hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageOff size={24} className="text-gray-300 dark:text-gray-700" />
          </div>
        )}
        
        {/* Bias Indicator Strip */}
        <div 
          className="absolute bottom-0 left-0 w-full h-1" 
          style={{ backgroundColor: colors.hex }} 
          title={`Orientare: ${article.bias}`}
        />
      </a>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4 gap-2.5">
        {/* Source & Time */}
        <div className="flex items-center justify-between gap-2">
          {article.source ? (
            <SourcePopover source={article.source} />
          ) : (
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Unknown</span>
          )}
          <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            <Clock size={10} />
            <span suppressHydrationWarning>{timeAgo(article.published_at)}</span>
          </div>
        </div>

        {/* Title */}
        <a
          href={article.link}
          target="_blank"
          rel="noopener noreferrer"
          className="block group"
        >
          <h3 className={`
            text-base font-bold leading-[1.3] text-slate-900 dark:text-slate-100 line-clamp-3 
            group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors
            ${settings.titleFont === "serif" ? "font-serif" : "font-sans"}
          `}>
            {article.title}
          </h3>
        </a>

        {/* Summary */}
        {article.summary && (
          <p className="text-[12px] text-slate-600 dark:text-slate-400 leading-normal line-clamp-3 flex-1 font-medium">
            {article.summary}
          </p>
        )}

        {/* Footer Link */}
        <div className="pt-2">
          <a
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-slate-100 hover:opacity-70 transition-opacity border-b-2 border-slate-900 dark:border-white pb-0.5"
          >
            Read Story
            <ExternalLink size={10} />
          </a>
        </div>
      </div>
    </motion.article>
  );
}

/** Empty state placeholder pentru un slot lipsă dintr-un cluster */
export function NewsCardBlindspot({ bias }: { bias: "left" | "center" | "right" }) {
  const { biasLabels } = useSettings();
  const colors = BIAS_COLORS[bias];
  const label = biasLabels[bias];

  return (
    <div
      className={`
        flex flex-col items-center justify-center rounded-sm border border-dashed
        border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50
        min-h-[200px] p-6 gap-3
      `}
    >
      <div 
        className="w-1.5 h-8 opacity-20" 
        style={{ backgroundColor: colors.hex }} 
      />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 text-center">
        {label} Blindspot
        <br />
        <span className="font-bold opacity-60">No coverage detected</span>
      </p>
    </div>
  );
}
