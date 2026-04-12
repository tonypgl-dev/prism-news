import { createClient } from "@supabase/supabase-js";
import type { Article } from "@/types";
import { FEED_FROM_ALL } from "@/lib/feed-from";

// ----------------------------------------------------------------
// Tipuri Supabase (reflectă schema.sql)
// ----------------------------------------------------------------

type SupabaseSource = {
  id: string;
  name: string;
  rss_url: string;
  bias: "left" | "center" | "right";
  logo_url: string | null;
  owner: string | null;
  notable_interests: string | null;
  factuality_score: number | null;
  profile_url: string | null;
};

type SupabaseArticle = {
  id: string;
  source_id: string;
  title: string;
  summary: string | null;
  link: string;
  image_url: string | null;
  published_at: string;
  bias: "left" | "center" | "right";
  cluster_id: string | null;
  original_snippet: string | null;
  ai_pre_summary: string | null;
  ai_summary: string | null;
  subscription_topic: string | null;
  category: string | null;
  content_html: string | null;
  // Supabase returnează join-ul ca array; primul element = sursa articolului
  sources: SupabaseSource[] | null;
};

// ----------------------------------------------------------------
// Client server-side (service role – nu se expune în browser)
// ----------------------------------------------------------------

export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "[supabase] Lipsesc variabilele de mediu NEXT_PUBLIC_SUPABASE_URL și/sau cheile de acces. " +
        "Copiază .env.local.example în .env.local și completează valorile."
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

// ----------------------------------------------------------------
// Select string reutilizabil
// ----------------------------------------------------------------

const ARTICLE_SELECT = `
  id, source_id, title, summary, link, image_url,
  published_at, bias, cluster_id, original_snippet,
  ai_pre_summary, ai_summary, subscription_topic,
  category, content_html,
  sources (
    id, name, logo_url, bias, owner,
    notable_interests, factuality_score, profile_url
  )
`;

function mapRow(row: SupabaseArticle): Article {
  const src = Array.isArray(row.sources) ? row.sources[0] : row.sources;
  return {
    id: row.id,
    source_id: row.source_id,
    title: row.title,
    summary: row.summary,
    link: row.link,
    image_url: row.image_url,
    published_at: row.published_at,
    bias: row.bias,
    cluster_id: row.cluster_id,
    original_snippet: row.original_snippet,
    ai_pre_summary: row.ai_pre_summary,
    ai_summary: row.ai_summary,
    subscription_topic: row.subscription_topic,
    category: row.category ?? null,
    content_html: row.content_html ?? null,
    source: src
      ? {
          id: src.id,
          name: src.name,
          logo_url: src.logo_url,
          bias: src.bias,
          owner: src.owner,
          notable_interests: src.notable_interests,
          factuality_score: src.factuality_score,
          profile_url: src.profile_url,
        }
      : undefined,
  };
}

// ----------------------------------------------------------------
// Query principal: ultimele N articole cu sursa inclusă
// ----------------------------------------------------------------

export interface FetchArticlesOptions {
  limit?: number;
  offset?: number;
  from?: string; // ISO string
}

export async function fetchLatestArticles(
  limitOrOptions: number | FetchArticlesOptions = 30
): Promise<Article[]> {
  const supabase = createServerClient();

  const opts: FetchArticlesOptions =
    typeof limitOrOptions === "number"
      ? { limit: limitOrOptions }
      : limitOrOptions;

  const { limit = 30, offset = 0, from } = opts;

  let query = supabase
    .from("articles")
    .select(ARTICLE_SELECT)
    .order("published_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (from) {
    query = query.gte("published_at", from);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[supabase] Eroare fetch articole:", error.message);
    return [];
  }

  return (data as unknown as SupabaseArticle[]).map(mapRow);
}

// ----------------------------------------------------------------
// Query pentru API route (cu count total)
// ----------------------------------------------------------------

export async function fetchArticlesPaginated(opts: {
  limit: number;
  offset: number;
  /** ISO sau `all` — fără filtru temporal când lipsește sau e `all`. */
  from?: string;
}): Promise<{ articles: Article[]; total: number }> {
  const supabase = createServerClient();

  const lower = opts.from && opts.from !== FEED_FROM_ALL ? opts.from : null;

  let q = supabase.from("articles").select(ARTICLE_SELECT, { count: "exact" });
  if (lower) q = q.gte("published_at", lower);
  const { data, error, count } = await q
    .order("published_at", { ascending: false })
    .range(opts.offset, opts.offset + opts.limit - 1);

  if (error) {
    console.error("[supabase] Eroare fetch paginated:", error.message);
    return { articles: [], total: 0 };
  }

  return {
    articles: (data as unknown as SupabaseArticle[]).map(mapRow),
    total: count ?? 0,
  };
}

/**
 * Rezolvă un slug de titlu (ex: "ciolacu-anunta-cresterea") în cluster_id.
 * Folosește funcția Postgres `find_cluster_by_title_slug` care face unaccent + ilike.
 * Returnează null dacă nu găsește niciun articol potrivit.
 */
export async function fetchClusterIdBySlug(slug: string): Promise<string | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase.rpc("find_cluster_by_title_slug", { p_slug: slug });
  if (error) {
    console.error("[supabase] fetchClusterIdBySlug:", error.message);
    return null;
  }
  return (data as string) ?? null;
}

export async function fetchArticlesByClusterId(clusterId: string): Promise<Article[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("articles")
    .select(ARTICLE_SELECT)
    .eq("cluster_id", clusterId)
    .order("published_at", { ascending: false });

  if (error) {
    console.error("[supabase] fetchArticlesByClusterId:", error.message);
    return [];
  }
  return (data as unknown as SupabaseArticle[]).map(mapRow);
}

// ----------------------------------------------------------------
// Căutare cu unaccent (diacritice opționale)
// Folosește RPC-uri Postgres care aplică unaccent() pe ambele părți.
// SQL necesar în Supabase (o singură dată):
//
//   CREATE OR REPLACE FUNCTION search_article_ids(
//     p_query text, p_limit int DEFAULT 20, p_from_date text DEFAULT NULL
//   ) RETURNS TABLE(id uuid, published_at timestamptz) LANGUAGE sql STABLE AS $$
//     SELECT id, published_at FROM articles
//     WHERE (
//       unaccent(lower(title)) ILIKE unaccent(lower('%' || p_query || '%'))
//       OR unaccent(lower(COALESCE(summary, ''))) ILIKE unaccent(lower('%' || p_query || '%'))
//     )
//     AND (p_from_date IS NULL OR published_at >= p_from_date::timestamptz)
//     ORDER BY published_at DESC LIMIT p_limit;
//   $$;
//
//   CREATE OR REPLACE FUNCTION count_search_articles(
//     p_query text, p_from_date text DEFAULT NULL
//   ) RETURNS bigint LANGUAGE sql STABLE AS $$
//     SELECT COUNT(*) FROM articles
//     WHERE (
//       unaccent(lower(title)) ILIKE unaccent(lower('%' || p_query || '%'))
//       OR unaccent(lower(COALESCE(summary, ''))) ILIKE unaccent(lower('%' || p_query || '%'))
//     )
//     AND (p_from_date IS NULL OR published_at >= p_from_date::timestamptz);
//   $$;
// ----------------------------------------------------------------

/**
 * Caută în `title` și `summary` cu suport diacritice opționale (unaccent).
 * "cumpara" găsește "cumpără", "stire" găsește "știre" etc.
 * @param from ISO minim published_at. Lipsește → ultimele 7 zile. `null` → fără filtru temporal.
 */
export async function searchArticles(opts: {
  query: string;
  from?: string | null;
}): Promise<Article[]> {
  const q = opts.query.trim();
  if (q.length < 2) return [];

  const supabase = createServerClient();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const fromBound = opts.from === undefined ? sevenDaysAgo : opts.from;

  // Pas 1: obținem ID-urile articolelor (ordonate) via RPC cu unaccent
  const { data: idRows, error: rpcError } = await supabase.rpc("search_article_ids", {
    p_query: q,
    p_limit: 20,
    p_from_date: fromBound ?? null,
  });

  if (rpcError) {
    console.error("[supabase] search_article_ids RPC:", rpcError.message);
    return [];
  }
  if (!idRows?.length) return [];

  const ids = (idRows as { id: string }[]).map((r) => r.id);

  // Pas 2: fetch complet cu sources join (păstrăm ordinea din RPC)
  const { data, error } = await supabase
    .from("articles")
    .select(ARTICLE_SELECT)
    .in("id", ids);

  if (error) {
    console.error("[supabase] searchArticles fetch:", error.message);
    return [];
  }

  const articles = (data as unknown as SupabaseArticle[]).map(mapRow);
  // Re-ordonăm după ordinea din RPC (published_at desc)
  return ids.map((id) => articles.find((a) => a.id === id)).filter(Boolean) as Article[];
}

/** Număr total de rânduri care se potrivesc, cu unaccent. */
export async function searchArticlesCount(opts: {
  query: string;
  from?: string | null;
}): Promise<number> {
  const q = opts.query.trim();
  if (q.length < 2) return 0;

  const supabase = createServerClient();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const fromBound = opts.from === undefined ? sevenDaysAgo : opts.from;

  const { data, error } = await supabase.rpc("count_search_articles", {
    p_query: q,
    p_from_date: fromBound ?? null,
  });

  if (error) {
    console.error("[supabase] count_search_articles RPC:", error.message);
    return 0;
  }

  return (data as number) ?? 0;
}

// ----------------------------------------------------------------
// Articole editoriale Prism News (content_html IS NOT NULL)
// ----------------------------------------------------------------

export async function fetchEditorialArticles(opts: { limit?: number } = {}): Promise<Article[]> {
  const supabase = createServerClient();
  const { limit = 10 } = opts;

  const { data, error } = await supabase
    .from("articles")
    .select(ARTICLE_SELECT)
    .not("content_html", "is", null)
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[supabase] fetchEditorialArticles:", error.message);
    return [];
  }

  return (data as unknown as SupabaseArticle[]).map(mapRow);
}

export async function fetchEditorialArticleById(id: string): Promise<Article | null> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("articles")
    .select(ARTICLE_SELECT)
    .eq("id", id)
    .not("content_html", "is", null)
    .single();

  if (error) {
    console.error("[supabase] fetchEditorialArticleById:", error.message);
    return null;
  }

  return mapRow(data as unknown as SupabaseArticle);
}


