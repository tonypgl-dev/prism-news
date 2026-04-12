"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { PhotoSlider } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";


function collectCaption(img: HTMLImageElement): string | null {
  const figure = img.closest("figure");
  if (figure) {
    const fc = figure.querySelector("figcaption");
    const t = fc?.textContent?.trim();
    if (t) return t;
  }
  const alt = img.getAttribute("alt")?.trim();
  return alt || null;
}

type Props = {
  contentHtml: string;
  externalHero?: boolean;
  className?: string;
  style?: CSSProperties;
  "data-category"?: string;
};

export function EditorialHtmlBody({
  contentHtml,
  externalHero,
  className,
  style,
  "data-category": dataCategory,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [slides, setSlides] = useState<
    { key: number | string; src?: string; overlay?: ReactNode }[]
  >([]);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const handleClick = (e: MouseEvent) => {
      const el = e.target;
      if (!el || !(el instanceof HTMLImageElement)) return;
      const img = el;
      if (externalHero && img.closest(".hero")) return;

      const src = img.currentSrc || img.src;
      if (!src) return;

      e.preventDefault();
      e.stopPropagation();

      const list = Array.from(root.querySelectorAll<HTMLImageElement>("img")).filter((im) => {
        if (externalHero && im.closest(".hero")) return false;
        return Boolean(im.currentSrc || im.src);
      });

      const idx = list.indexOf(img);
      const built = list.map((im, j) => {
        const s = im.currentSrc || im.src;
        const cap = collectCaption(im);
        const overlay: ReactNode | undefined = cap ? (
          <div className="max-w-2xl mx-auto px-4 pb-8 pt-2 text-center text-sm text-white/95 leading-relaxed border-t border-white/10 mt-2">
            {cap}
          </div>
        ) : undefined;
        return {
          key: j,
          src: s,
          overlay,
        };
      });

      setSlides(built);
      setIndex(Math.max(0, idx));
      setOpen(true);
    };

    root.addEventListener("click", handleClick);
    return () => root.removeEventListener("click", handleClick);
  }, [contentHtml, externalHero]);

  return (
    <>
      <div
        ref={containerRef}
        className={className}
        style={style}
        data-category={dataCategory}
        data-external-hero={externalHero ? "true" : undefined}
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />
      <PhotoSlider
        images={slides}
        visible={open}
        onClose={() => setOpen(false)}
        index={index}
        onIndexChange={setIndex}
        maskOpacity={0.65}
        maskClassName="!backdrop-blur-xl !bg-black/70"
        photoWrapClassName="ed-photo-wrap"
        className="ed-photo-slider"
      />
    </>
  );
}
