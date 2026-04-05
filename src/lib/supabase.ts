import { createClient } from "@supabase/supabase-js";
import type { Article } from "@/types";

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
  from: string;
}): Promise<{ articles: Article[]; total: number }> {
  const supabase = createServerClient();

  const { data, error, count } = await supabase
    .from("articles")
    .select(ARTICLE_SELECT, { count: "exact" })
    .gte("published_at", opts.from)
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
// Căutare titlu + summary (ilike OR)
// ----------------------------------------------------------------

function escapeIlikePattern(raw: string): string {
  return raw
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_");
}

/**
 * Caută în `title` și `summary` (ilike, OR). Max 20 rezultate, published_at desc.
 * @param from ISO minim published_at. Lipsește → ultimele 7 zile. `null` → fără filtru temporal.
 */
export async function searchArticles(opts: {
  query: string;
  from?: string | null;
}): Promise<Article[]> {
  const q = opts.query.trim();
  if (q.length < 2) return [];

  const supabase = createServerClient();
  const pattern = `%${escapeIlikePattern(q)}%`;
  const orClause = `title.ilike."${pattern}",summary.ilike."${pattern}"`;

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const fromBound = opts.from === undefined ? sevenDaysAgo : opts.from;

  let queryBuilder = supabase
    .from("articles")
    .select(ARTICLE_SELECT)
    .or(orClause)
    .order("published_at", { ascending: false })
    .limit(20);

  if (fromBound !== null) {
    queryBuilder = queryBuilder.gte("published_at", fromBound);
  }

  const { data, error } = await queryBuilder;

  if (error) {
    console.error("[supabase] searchArticles:", error.message);
    return [];
  }

  return (data as unknown as SupabaseArticle[]).map(mapRow);
}

/** Număr total de rânduri care se potrivesc (fără limit 20), pentru API search. */
export async function searchArticlesCount(opts: {
  query: string;
  from?: string | null;
}): Promise<number> {
  const q = opts.query.trim();
  if (q.length < 2) return 0;

  const supabase = createServerClient();
  const pattern = `%${escapeIlikePattern(q)}%`;
  const orClause = `title.ilike."${pattern}",summary.ilike."${pattern}"`;

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const fromBound = opts.from === undefined ? sevenDaysAgo : opts.from;

  let queryBuilder = supabase
    .from("articles")
    .select("id", { count: "exact", head: true })
    .or(orClause);

  if (fromBound !== null) {
    queryBuilder = queryBuilder.gte("published_at", fromBound);
  }

  const { count, error } = await queryBuilder;

  if (error) {
    console.error("[supabase] searchArticlesCount:", error.message);
    return 0;
  }

  return count ?? 0;
}
