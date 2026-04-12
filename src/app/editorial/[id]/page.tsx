import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { fetchEditorialArticleById } from "@/lib/supabase";
import { Header } from "@/components/Header";
import { getCategoryLabel, CATEGORY_MAP } from "@/lib/editorial-categories";

export const revalidate = 3600;

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const article = await fetchEditorialArticleById(id);
  if (!article) return { title: "Articol editorial — Prisma News" };

  return {
    title: `${article.title} — Prisma News`,
    description: article.summary ?? undefined,
    openGraph: {
      title: article.title,
      description: article.summary ?? undefined,
      images: article.image_url ? [{ url: article.image_url }] : undefined,
      type: "article",
      siteName: "Prisma News",
      locale: "ro_RO",
    },
  };
}

export default async function EditorialArticlePage({ params }: Props) {
  const { id } = await params;
  const article = await fetchEditorialArticleById(id);
  if (!article || !article.content_html) notFound();

  const categoryLabel = article.category ? getCategoryLabel(article.category) : null;
  const cat = article.category ? CATEGORY_MAP[article.category] : null;
  const accentColor = cat?.accent ?? "#C8963E";

  return (
    <>
      <Header sticky={false} />

      {/* Category pill */}
      {categoryLabel && (
        <div className="max-w-[780px] mx-auto px-5 pt-5 pb-1">
          <span
            className="inline-block text-[10px] font-bold uppercase tracking-[3px] px-3 py-1 rounded-full border"
            style={{
              color: accentColor,
              borderColor: `${accentColor}55`,
            }}
          >
            ✦ Prism News · {categoryLabel}
          </span>
        </div>
      )}

      {article.image_url && (
        <div className="max-w-[780px] mx-auto px-5 pt-2 pb-3">
          <div className="relative w-full aspect-[16/9] max-h-[min(420px,50vh)] rounded-sm overflow-hidden border border-[var(--card-border)] bg-[var(--card)]">
            <Image
              src={article.image_url}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 780px) 100vw, 780px"
              priority
            />
          </div>
        </div>
      )}

      {/* Article HTML content — CSS vars per categorie injectate inline */}
      <div
        className="editorial-wrapper"
        data-category={article.category ?? undefined}
        style={cat ? {
          "--ed-accent":          cat.accent,
          "--ed-accent-dark":     cat.accentDark,
          "--ed-hero-from":       cat.hero[0],
          "--ed-hero-mid":        cat.hero[1],
          "--ed-hero-to":         cat.hero[2],
          "--ed-tips-bg":         cat.tipsBg,
          "--ed-tips-bg-dark":    cat.tipsBgDark,
          "--ed-tips-color":      cat.tipsColor,
          "--ed-tips-color-dark": cat.tipsColorDark,
        } as React.CSSProperties : undefined}
        dangerouslySetInnerHTML={{ __html: article.content_html }}
      />

      {/* Back footer */}
      <div className="max-w-[780px] mx-auto px-5 pt-2 pb-12 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-sm border border-[var(--card-border)] text-xs font-bold uppercase tracking-widest text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--foreground)] transition-all"
        >
          <ArrowLeft size={12} />
          Înapoi la Prisma News
        </Link>
      </div>

      <style>{editorialStyles}</style>
    </>
  );
}

const editorialStyles = `
  .editorial-wrapper {
    /* Fallback gospodarie dacă data-category lipsește */
    --ed-accent:          #C8963E;
    --ed-accent-dark:     #D4A857;
    --ed-hero-from:       #2d1f18;
    --ed-hero-mid:        #4a3428;
    --ed-hero-to:         #5c4336;
    --ed-tips-bg:         #f5f0e8;
    --ed-tips-bg-dark:    #1a1512;
    --ed-tips-color:      #5c3d2e;
    --ed-tips-color-dark: #b08030;
    box-sizing: border-box;
    font-family: var(--font-geist-sans), Georgia, serif;
    line-height: 1.75;
    color: var(--foreground);
    background: var(--background);
  }

  /* Dark mode: comută pe variantele deschise ale accentelor per categorie */
  .dark .editorial-wrapper {
    --ed-accent: var(--ed-accent-dark);
    --ed-tips-bg: var(--ed-tips-bg-dark);
    --ed-tips-color: var(--ed-tips-color-dark);
  }

  .editorial-wrapper *,
  .editorial-wrapper *::before,
  .editorial-wrapper *::after {
    box-sizing: border-box;
  }

  /* Hero — gradient brun păstrat; titluri aliniate cu paleta site (slate clar pe fundal închis) */
  .editorial-wrapper .hero {
    position: relative;
    background: linear-gradient(135deg, var(--ed-hero-from) 0%, var(--ed-hero-mid) 42%, var(--ed-hero-to) 100%);
    padding: clamp(3rem, 8vw, 4.5rem) 1.5rem clamp(2.75rem, 6vw, 3.5rem);
    text-align: center;
    overflow: hidden;
    margin: 0;
  }

  .editorial-wrapper .hero::before {
    content: "";
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse at 20% 50%, color-mix(in srgb, var(--ed-accent) 18%, transparent) 0%, transparent 58%),
      radial-gradient(ellipse at 80% 30%, rgba(148, 163, 184, 0.08) 0%, transparent 52%);
    pointer-events: none;
  }

  .editorial-wrapper .hero::after {
    content: "";
    position: absolute;
    bottom: -2px;
    left: 0;
    right: 0;
    height: 2rem;
    background: var(--background);
    clip-path: ellipse(55% 100% at 50% 100%);
  }

  .editorial-wrapper .hero-badge {
    position: relative;
    z-index: 1;
    display: inline-block;
    font-family: var(--font-geist-sans), system-ui, sans-serif;
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: color-mix(in srgb, #f1f5f9 88%, var(--ed-accent) 12%);
    border: 1px solid color-mix(in srgb, var(--ed-accent) 45%, transparent);
    padding: 0.4rem 1.15rem;
    border-radius: 999px;
    margin-bottom: 1.5rem;
  }

  .editorial-wrapper .hero h1 {
    position: relative;
    z-index: 1;
    font-family: var(--font-playfair), Georgia, serif;
    font-size: clamp(1.625rem, 4.5vw, 3rem);
    font-weight: 700;
    color: #f8fafc;
    line-height: 1.2;
    max-width: 42rem;
    margin: 0 auto 1rem;
  }

  .editorial-wrapper .hero h1 em {
    color: var(--ed-accent);
    font-style: italic;
  }

  .editorial-wrapper .hero-subtitle {
    position: relative;
    z-index: 1;
    font-family: var(--font-geist-sans), system-ui, sans-serif;
    font-size: 0.9375rem;
    font-weight: 400;
    font-style: italic;
    color: color-mix(in srgb, #f1f5f9 72%, transparent);
    max-width: 30rem;
    margin: 0 auto;
    line-height: 1.55;
  }

  .editorial-wrapper .ornament {
    text-align: center;
    padding: 1.5rem 0;
    letter-spacing: 0.65em;
    color: var(--ed-accent);
    opacity: 0.55;
    background: var(--background);
    font-size: 1.125rem;
  }

  .editorial-wrapper .article-container {
    max-width: 43.75rem;
    margin: 0 auto;
    padding: 0 1.5rem 4rem;
    background: var(--background);
  }

  .editorial-wrapper .article-meta {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 0.75rem 1rem;
    padding: 0.5rem 0 1.5rem;
    font-family: var(--font-geist-sans), system-ui, sans-serif;
    font-size: 0.8125rem;
    color: var(--muted);
  }

  .editorial-wrapper .meta-dot {
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: var(--ed-accent);
    flex-shrink: 0;
  }

  .editorial-wrapper .teaser-section p {
    margin-bottom: 1.125rem;
    line-height: 1.8;
    color: var(--foreground);
  }

  .editorial-wrapper a {
    color: var(--accent);
    text-decoration: underline;
    text-decoration-color: color-mix(in srgb, var(--accent) 40%, transparent);
  }

  .editorial-wrapper a:hover {
    text-decoration-color: var(--accent);
  }

  .editorial-wrapper .teaser-section p:first-child::first-letter {
    float: left;
    font-family: var(--font-playfair), Georgia, serif;
    font-size: 3.75rem;
    line-height: 0.85;
    margin: 0.15rem 0.65rem 0 0;
    color: var(--ed-accent);
    font-weight: 700;
  }

  .editorial-wrapper .read-more-wrapper {
    display: none !important;
  }

  .editorial-wrapper .expanded-content {
    max-height: none !important;
    opacity: 1 !important;
    overflow: visible !important;
  }

  .editorial-wrapper .section-heading {
    font-family: var(--font-playfair), Georgia, serif;
    font-size: clamp(1.25rem, 2.5vw, 1.5rem);
    font-weight: 700;
    color: var(--foreground);
    margin: 2.5rem 0 1rem;
    padding-left: 1rem;
    position: relative;
  }

  .editorial-wrapper .section-heading::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0.2em;
    bottom: 0.2em;
    width: 3px;
    border-radius: 2px;
    background: linear-gradient(to bottom, var(--ed-accent), color-mix(in srgb, var(--accent) 70%, var(--ed-accent)));
  }

  .editorial-wrapper .sub-heading {
    font-family: var(--font-playfair), Georgia, serif;
    font-size: 1.15rem;
    font-weight: 600;
    font-style: italic;
    color: var(--muted);
    margin: 1.75rem 0 0.65rem;
  }

  .editorial-wrapper .expanded-content p {
    margin-bottom: 1rem;
    line-height: 1.8;
    color: var(--foreground);
  }

  .editorial-wrapper .expanded-content strong {
    font-weight: 600;
    color: var(--foreground);
  }

  .editorial-wrapper .highlight-box {
    background: color-mix(in srgb, var(--card) 96%, var(--ed-accent) 4%);
    border: 1px solid var(--card-border);
    border-left: 4px solid var(--ed-accent);
    border-radius: 0 var(--radius) var(--radius) 0;
    padding: 1.25rem 1.35rem;
    margin: 1.5rem 0;
    font-style: italic;
    color: var(--muted);
    line-height: 1.65;
  }

  .dark .editorial-wrapper .highlight-box {
    background: color-mix(in srgb, var(--card) 94%, var(--ed-accent) 6%);
    box-shadow: 0 1px 0 rgba(148, 163, 184, 0.06);
  }

  .editorial-wrapper .highlight-box strong {
    font-style: normal;
    color: var(--foreground);
  }

  .editorial-wrapper .science-card {
    position: relative;
    background: var(--card);
    border: 1px solid var(--card-border);
    border-radius: calc(var(--radius) + 4px);
    padding: 1.35rem 1.5rem;
    margin: 1.5rem 0;
    overflow: hidden;
  }

  .editorial-wrapper .science-card::before {
    content: "🔬";
    position: absolute;
    top: -0.35rem;
    right: 0.85rem;
    font-size: 2.75rem;
    opacity: 0.07;
  }

  .editorial-wrapper .science-card h4 {
    font-family: var(--font-geist-sans), system-ui, sans-serif;
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--ed-accent);
    margin: 0 0 0.5rem;
  }

  .editorial-wrapper .science-card p {
    margin-bottom: 0.4rem;
    line-height: 1.65;
    color: var(--muted);
    font-size: 0.9375rem;
  }

  .editorial-wrapper .science-card p:last-child {
    margin-bottom: 0;
  }

  .editorial-wrapper .tips-section {
    border: 1px solid var(--card-border);
    border-radius: calc(var(--radius) + 6px);
    padding: 1.75rem 1.5rem;
    margin: 2rem 0;
    background: color-mix(in srgb, var(--card) 88%, var(--background) 12%);
  }

  .dark .editorial-wrapper .tips-section {
    background: color-mix(in srgb, var(--card) 92%, var(--ed-accent) 4%);
    box-shadow: 0 2px 24px rgba(0, 0, 0, 0.25);
  }

  .editorial-wrapper .tips-section h3 {
    font-family: var(--font-playfair), Georgia, serif;
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--foreground);
    margin: 0 0 1rem;
    text-align: center;
  }

  .editorial-wrapper .tip-item {
    display: flex;
    gap: 0.85rem;
    padding: 0.85rem 0;
    border-bottom: 1px solid var(--card-border);
  }

  .editorial-wrapper .tip-item:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  .editorial-wrapper .tip-number {
    flex-shrink: 0;
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    background: color-mix(in srgb, var(--ed-accent) 22%, var(--card));
    color: var(--foreground);
    border: 1px solid color-mix(in srgb, var(--ed-accent) 45%, var(--card-border));
    font-family: var(--font-playfair), Georgia, serif;
    font-size: 0.9rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 0.1rem;
  }

  .editorial-wrapper .tip-text {
    line-height: 1.65;
    color: var(--foreground);
    font-size: 0.9375rem;
  }

  .editorial-wrapper .tip-text strong {
    color: var(--foreground);
  }

  .editorial-wrapper .conclusion-section {
    background: linear-gradient(145deg, var(--ed-hero-from) 0%, var(--ed-hero-mid) 55%, var(--ed-hero-to) 100%);
    border-radius: calc(var(--radius) + 6px);
    padding: 1.75rem 1.5rem;
    margin: 2.25rem 0 0.75rem;
    border: 1px solid color-mix(in srgb, var(--ed-accent) 25%, transparent);
  }

  .dark .editorial-wrapper .conclusion-section {
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
  }

  .editorial-wrapper .conclusion-section h3 {
    font-family: var(--font-playfair), Georgia, serif;
    font-size: 1.2rem;
    font-weight: 700;
    color: color-mix(in srgb, #f8fafc 90%, var(--ed-accent));
    margin: 0 0 0.75rem;
  }

  .editorial-wrapper .conclusion-section p {
    color: rgba(241, 245, 249, 0.85);
    margin-bottom: 0.75rem;
    line-height: 1.75;
    font-size: 0.9375rem;
  }

  .editorial-wrapper .conclusion-section p:last-child {
    margin-bottom: 0;
  }

  .editorial-wrapper .conclusion-section p.ed-conclusion-signoff {
    color: var(--ed-accent);
    font-style: italic;
  }

  .editorial-wrapper .ed-conclusion-follow {
    margin-top: 0.875rem;
  }

  .editorial-wrapper .ed-conclusion-signoff {
    margin-top: 0.875rem;
  }

  .editorial-wrapper .article-footer {
    text-align: center;
    padding: 2rem 0 1rem;
    font-size: 0.6875rem;
    color: var(--muted);
    opacity: 0.45;
    letter-spacing: 0.06em;
    background: var(--background);
  }

  @media (max-width: 640px) {
    .editorial-wrapper .hero {
      padding: 2.5rem 1rem 2.25rem;
    }
    .editorial-wrapper .hero h1 {
      font-size: clamp(1.375rem, 6vw, 1.75rem);
    }
    .editorial-wrapper .article-container {
      padding: 0 1rem 3rem;
    }
    .editorial-wrapper .tips-section {
      padding: 1.25rem 1rem;
    }
    .editorial-wrapper .conclusion-section {
      padding: 1.5rem 1rem;
    }
    .editorial-wrapper .science-card {
      padding: 1rem 1rem;
    }
    .editorial-wrapper .teaser-section p:first-child::first-letter {
      font-size: 3rem;
    }
  }
`;
