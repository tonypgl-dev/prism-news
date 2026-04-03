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
  // Supabase returnează join-ul ca array; primul element = sursa articolului
  sources: SupabaseSource[] | null;
};

// ----------------------------------------------------------------
// Client server-side (service role – nu se expune în browser)
// ----------------------------------------------------------------

function createServerClient() {
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
// Query principal: ultimele N articole cu sursa inclusă (inner join)
// ----------------------------------------------------------------

export async function fetchLatestArticles(limit = 100): Promise<Article[]> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("articles")
    .select(
      `
      id,
      source_id,
      title,
      summary,
      link,
      image_url,
      published_at,
      bias,
      cluster_id,
      original_snippet,
      ai_pre_summary,
      ai_summary,
      sources (
        id,
        name,
        logo_url,
        bias,
        owner,
        notable_interests,
        factuality_score,
        profile_url
      )
    `
    )
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) {
    // Logăm eroarea pe server și returnăm array gol
    // (pagina va afișa starea goală în loc să crape)
    console.error("[supabase] Eroare fetch articole:", error.message);
    return [];
  }

  return (data as unknown as SupabaseArticle[]).map((row) => {
    // Supabase restituie join-ul one-to-one ca array cu un singur element
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
  });
}
