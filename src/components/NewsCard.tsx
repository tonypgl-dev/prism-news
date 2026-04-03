"use client";

import { ExternalLink, Clock, ImageOff } from "lucide-react";
import { motion } from "framer-motion";
import type { Article } from "@/types";
import { timeAgo, BIAS_COLORS } from "@/lib/utils";
import { useSettings } from "@/hooks/useSettings";
import { SourcePopover } from "./SourcePopover";

interface Props {
  article: Article;
  index?: number;
}

export function NewsCard({ article, index = 0 }: Props) {
  const { biasLabels } = useSettings();
  const colors = BIAS_COLORS[article.bias];

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.07, ease: "easeOut" }}
      className={`
        flex flex-col rounded-xl border overflow-hidden
        bg-white dark:bg-gray-900
        ${colors.border}
        shadow-sm hover:shadow-md transition-shadow duration-200
        h-full
      `}
    >
      {/* Thumbnail */}
      <a
        href={article.link}
        target="_blank"
        rel="noopener noreferrer"
        className="block relative aspect-video bg-gray-100 dark:bg-gray-800 overflow-hidden"
        tabIndex={-1}
        aria-hidden="true"
      >
        {article.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.image_url}
            alt={article.title}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageOff size={28} className="text-gray-300 dark:text-gray-600" />
          </div>
        )}
        {/* Bias ribbon */}
        <span
          className={`absolute top-2 left-2 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${colors.badge}`}
        >
          {biasLabels[article.bias]}
        </span>
      </a>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        {/* Source badge — click/hover deschide Ownership Popover */}
        {article.source ? (
          <SourcePopover source={article.source} />
        ) : (
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full shrink-0 ${colors.dot}`} />
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Sursă necunoscută
            </span>
          </div>
        )}

        {/* Title */}
        <a
          href={article.link}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <h3 className="text-sm font-bold leading-snug text-gray-900 dark:text-white line-clamp-3 hover:text-purple-700 dark:hover:text-purple-400 transition-colors">
            {article.title}
          </h3>
        </a>

        {/* Summary */}
        {article.summary && (
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-3 flex-1">
            {article.summary}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800 mt-auto">
          <div className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500">
            <Clock size={11} />
            <span>{timeAgo(article.published_at)}</span>
          </div>
          <a
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-1 text-[11px] font-semibold ${colors.text} hover:underline`}
          >
            Sursa originală
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
        flex flex-col items-center justify-center rounded-xl border border-dashed
        ${colors.border} ${colors.bg}
        min-h-[200px] p-6 gap-3
      `}
    >
      <div className={`w-3 h-3 rounded-full ${colors.dot} opacity-40`} />
      <p className={`text-xs font-semibold ${colors.text} opacity-60 text-center`}>
        Nicio știre de {label}
        <br />
        <span className="font-normal opacity-80">Blindspot detectat</span>
      </p>
    </div>
  );
}
