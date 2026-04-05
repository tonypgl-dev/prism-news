import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { SpectrumSection } from "@/components/SpectrumSection";
import { buildClusterRows } from "@/lib/cluster";
import { fetchLatestArticles, fetchArticlesByClusterId, fetchClusterIdBySlug } from "@/lib/supabase";
import { AlertCircle } from "lucide-react";

// Revalidare ISR: reconstituie pagina din 5 în 5 minute
export const revalidate = 300;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Rezolvă param `featured` (UUID sau slug) în cluster_id. */
async function resolveFeatured(featured: string): Promise<string | null> {
  if (UUID_RE.test(featured)) return featured;
  return fetchClusterIdBySlug(featured);
}

type PageProps = {
  searchParams: Promise<{ featured?: string }>;
};

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const featured = params?.featured;

  const defaultMeta: Metadata = {
    title: "Prisma News — Știri România din toate perspectivele",
    description:
      "Agregator de știri românesc cu vizualizare bias politic. Aceeași știre din perspectiva presei de stânga, centru și dreapta.",
    openGraph: {
      title: "Prisma News",
      description: "Știri România din toate perspectivele",
      url: "https://prisma-news.ro",
      siteName: "Prisma News",
      locale: "ro_RO",
      type: "website",
    },
  };

  if (!featured) return defaultMeta;

  // og:url conține ÎNTOTDEAUNA featured param — indiferent dacă rezoluția reușește
  const featuredUrl = `https://prisma-news.ro/?featured=${featured}`;

  const clusterId = await resolveFeatured(featured);
  if (!clusterId) {
    // Slug nu s-a rezolvat (RPC SQL lipsă sau cluster inexistent) —
    // returnăm totuși URL-ul corect ca Facebook să nu piardă param-ul
    return {
      ...defaultMeta,
      openGraph: { ...defaultMeta.openGraph as object, url: featuredUrl },
    };
  }

  const articles = await fetchArticlesByClusterId(clusterId);
  if (!articles.length) {
    return {
      ...defaultMeta,
      openGraph: { ...defaultMeta.openGraph as object, url: featuredUrl },
    };
  }

  const rep =
    articles.find((a) => a.bias === "center") ??
    articles.find((a) => a.bias === "left") ??
    articles[0];

  const description =
    rep.ai_pre_summary ?? rep.ai_summary ?? rep.summary ?? "Citește această știre pe Prisma News";

  return {
    title: `${rep.title} — Prisma News`,
    description,
    openGraph: {
      title: rep.title,
      description,
      url: `https://prisma-news.ro/?featured=${featured}`,
      siteName: "Prisma News",
      locale: "ro_RO",
      type: "article",
      images: rep.image_url
        ? [{ url: rep.image_url, width: 1200, height: 630, alt: rep.title }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: rep.title,
      description,
      images: rep.image_url ? [rep.image_url] : undefined,
    },
  };
}

export default async function HomePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const featuredParam = params?.featured;
  const featuredClusterId = featuredParam ? await resolveFeatured(featuredParam) ?? undefined : undefined;

  const from24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const articles = await fetchLatestArticles({ limit: 30, offset: 0, from: from24h });
  let rows = buildClusterRows(articles);

  // Dacă vine cu ?featured=..., punem clusterul respectiv primul
  if (featuredClusterId) {
    const alreadyInFeed = rows.some((r) => r.cluster_id === featuredClusterId);
    if (!alreadyInFeed) {
      const featuredArticles = await fetchArticlesByClusterId(featuredClusterId);
      if (featuredArticles.length > 0) {
        const featuredRows = buildClusterRows(featuredArticles);
        rows = [...featuredRows, ...rows];
      }
    } else {
      const featuredRow = rows.find((r) => r.cluster_id === featuredClusterId)!;
      rows = [featuredRow, ...rows.filter((r) => r.cluster_id !== featuredClusterId)];
    }
  }

  // Primele 8 titluri recente pentru Breaking Ticker
  const tickerItems = articles.slice(0, 8).map((a) => a.title);

  const today = new Date().toLocaleDateString("ro-RO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <Header tickerItems={tickerItems} dateLabel={today} />

      <main className="flex-1 max-w-screen-xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
        {/* Spectru + feed filtrat */}
        {articles.length === 0 ? (
          <EmptyState />
        ) : (
          <SpectrumSection
            rows={rows}
            totalArticles={articles.length}
            initialFrom={from24h}
            featuredClusterId={featuredClusterId}
          />
        )}
      </main>

      <footer className="border-t border-gray-200 dark:border-gray-800 mt-12 py-8">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            © {new Date().getFullYear()} Prisma News · prisma-news.ro
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
            Misiunea noastră: transparența editorială prin compararea perspectivelor
          </p>
        </div>
      </footer>
    </>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <div className="w-12 h-12 rounded-sm bg-slate-100 dark:bg-gray-800 flex items-center justify-center">
        <AlertCircle size={22} className="text-slate-400" />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">
          No Coverage Detected
        </p>
        <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 mt-2 uppercase tracking-widest leading-relaxed">
          The database is currently empty.<br />
          Run <code className="bg-slate-900 text-white dark:bg-white dark:text-black px-1">npm run fetch</code> to populate.
        </p>
      </div>
    </div>
  );
}
