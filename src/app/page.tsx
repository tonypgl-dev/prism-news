import { Header } from "@/components/Header";
import { BiasLegend } from "@/components/BiasLegend";
import { NewsPageClient } from "@/components/NewsPageClient";
import { buildClusterRows } from "@/lib/cluster";
import { fetchLatestArticles } from "@/lib/supabase";
import { Newspaper, AlertCircle } from "lucide-react";

// Revalidare ISR: reconstituie pagina din 5 în 5 minute
export const revalidate = 300;

export default async function HomePage() {
  const articles = await fetchLatestArticles(100);
  const rows = buildClusterRows(articles);

  const today = new Date().toLocaleDateString("ro-RO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <Header />

      <main className="flex-1 max-w-screen-xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
        {/* Page intro */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Newspaper size={16} className="text-purple-600" />
              <span className="text-xs font-semibold text-purple-600 uppercase tracking-widest">
                Azi în presă
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              Aceeași știre, trei perspective
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 capitalize">
              {today}
            </p>
          </div>
        </div>

        {/* Bias legend */}
        <BiasLegend />

        {/* Client section: toolbar cu filtru blindspot + grid */}
        {articles.length === 0 ? (
          <EmptyState />
        ) : (
          <NewsPageClient rows={rows} totalArticles={articles.length} />
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
      <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <AlertCircle size={22} className="text-gray-400" />
      </div>
      <div>
        <p className="font-semibold text-gray-700 dark:text-gray-300">
          Niciun articol disponibil momentan
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          Rulează{" "}
          <code className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
            npm run fetch
          </code>{" "}
          pentru a popula baza de date sau verifică conexiunea la Supabase.
        </p>
      </div>
    </div>
  );
}
