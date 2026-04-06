"use client";

/** Două rânduri, același stil ca numele publicației pe carduri (font-black, caps, tracking-widest). */
const row =
  "font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 text-[15px] sm:text-[18px]";

export function HomeTagline() {
  return (
    <div
      className="flex flex-col items-center gap-1 text-center leading-none"
      role="status"
      aria-label="Știri din toate perspectivele"
    >
      <span className={row}>Știri</span>
      <span className={row}>din toate perspectivele</span>
    </div>
  );
}
