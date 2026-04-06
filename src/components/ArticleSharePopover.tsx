"use client";

import { useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import {
  Share2,
  MessageCircle,
  Globe,
  Camera,
  Smartphone,
  Mail,
  Link2,
} from "lucide-react";

type Props = {
  slug: string;
  articleTitle: string;
  onCopied?: () => void;
};

function buildFeaturedUrl(slug: string) {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/?featured=${slug}`;
}

export function ArticleSharePopover({ slug, articleTitle, onCopied }: Props) {
  const [open, setOpen] = useState(false);

  const url = buildFeaturedUrl(slug);
  const shareText = `${articleTitle}\n${url}`;
  const canNativeShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  function copyLink() {
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => {
      onCopied?.();
      setOpen(false);
    });
  }

  function openExternal(href: string) {
    window.open(href, "_blank", "noopener,noreferrer");
    setOpen(false);
  }

  async function nativeShare() {
    if (!canNativeShare || !url) return;
    try {
      await navigator.share({
        title: articleTitle,
        text: shareText,
        url,
      });
      setOpen(false);
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        /* ignore */
      }
    }
  }

  const itemClass = `
    flex w-full items-center gap-2.5 rounded-sm px-2.5 py-2 text-left text-[10px] font-black uppercase tracking-widest
    text-slate-700 dark:text-slate-200
    hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors
    focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500
    disabled:opacity-40 disabled:pointer-events-none
  `;

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          title="Partajează"
          aria-label="Deschide opțiuni de partajare"
          onClick={(e) => e.stopPropagation()}
          className="text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 transition-colors"
        >
          <Share2 size={13} strokeWidth={2.25} />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="top"
          align="end"
          sideOffset={6}
          collisionPadding={8}
          onClick={(e) => e.stopPropagation()}
          className={`
            z-[60] w-[11.5rem] rounded-sm border shadow-2xl shadow-black/20
            bg-white dark:bg-gray-950
            border-gray-200 dark:border-gray-800
            p-1 animate-in fade-in-0 zoom-in-95
          `}
        >
          <p className="px-2.5 pt-1.5 pb-1 text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Partajează
          </p>
          <div className="flex flex-col gap-0.5 pb-1">
            {canNativeShare && (
              <button
                type="button"
                className={itemClass}
                onClick={(e) => {
                  e.stopPropagation();
                  void nativeShare();
                }}
              >
                <Share2 size={14} strokeWidth={2} className="shrink-0 opacity-70" />
                Partajează…
              </button>
            )}
            <button
              type="button"
              disabled={!url}
              className={itemClass}
              onClick={(e) => {
                e.stopPropagation();
                openExternal(
                  `https://wa.me/?text=${encodeURIComponent(shareText)}`
                );
              }}
            >
              <MessageCircle
                size={14}
                strokeWidth={2}
                className="shrink-0 text-emerald-600 dark:text-emerald-400"
              />
              WhatsApp
            </button>
            <button
              type="button"
              disabled={!url}
              className={itemClass}
              onClick={(e) => {
                e.stopPropagation();
                openExternal(
                  `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
                );
              }}
            >
              <Globe size={14} strokeWidth={2} className="shrink-0 text-blue-600 dark:text-blue-400" />
              Facebook
            </button>
            <button
              type="button"
              disabled={!url}
              className={itemClass}
              title="Copiază linkul în clipboard — lipește în Stories sau DM"
              onClick={(e) => {
                e.stopPropagation();
                copyLink();
              }}
            >
              <Camera size={14} strokeWidth={2} className="shrink-0 text-pink-600 dark:text-pink-400" />
              Instagram
            </button>
            <button
              type="button"
              disabled={!url}
              className={itemClass}
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = `sms:?body=${encodeURIComponent(shareText)}`;
                setOpen(false);
              }}
            >
              <Smartphone size={14} strokeWidth={2} className="shrink-0 opacity-70" />
              SMS
            </button>
            <button
              type="button"
              disabled={!url}
              className={itemClass}
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = `mailto:?subject=${encodeURIComponent(articleTitle)}&body=${encodeURIComponent(shareText)}`;
                setOpen(false);
              }}
            >
              <Mail size={14} strokeWidth={2} className="shrink-0 opacity-70" />
              Email
            </button>
            <button
              type="button"
              disabled={!url}
              className={itemClass}
              onClick={(e) => {
                e.stopPropagation();
                copyLink();
              }}
            >
              <Link2 size={14} strokeWidth={2} className="shrink-0 opacity-70" />
              Copiază link
            </button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
