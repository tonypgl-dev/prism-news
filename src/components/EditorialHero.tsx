import Image from "next/image";

type Props = {
  imageUrl: string;
  title: string;
  categoryLabel: string | null;
  accentColor: string;
  summary: string | null;
};

export function EditorialHero({ imageUrl, title, categoryLabel, accentColor, summary }: Props) {
  return (
    <section className="w-full max-w-[min(100%,1200px)] mx-auto px-4 sm:px-6 pt-4 pb-1" aria-label="Antet articol">
      <div className="relative w-full aspect-[21/9] min-h-[200px] max-h-[min(52vh,520px)] rounded-sm overflow-hidden border border-[var(--card-border)] bg-[var(--card)] shadow-sm">
        <Image
          src={imageUrl}
          alt=""
          fill
          className="object-cover"
          sizes="(max-width: 1200px) 100vw, 1200px"
          priority
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/30"
          aria-hidden
        />
        <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-8 md:px-10 md:pb-10 md:pt-16">
          {categoryLabel && (
            <span
              className="inline-flex w-fit text-[10px] font-bold uppercase tracking-[3px] px-3 py-1 rounded-full border bg-black/25 backdrop-blur-sm"
              style={{
                color: accentColor,
                borderColor: `${accentColor}66`,
                textShadow: "0 1px 2px rgba(0,0,0,0.5)",
              }}
            >
              ✦ Prism News · {categoryLabel}
            </span>
          )}
          <h1
            className="font-serif text-2xl sm:text-3xl md:text-[2.35rem] font-bold text-white leading-[1.15] mt-4 max-w-[42rem] drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)]"
          >
            {title}
          </h1>
          {summary && (
            <p className="mt-3 text-sm sm:text-base text-white/88 max-w-2xl line-clamp-3 leading-relaxed font-sans font-normal">
              {summary}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
