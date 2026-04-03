/**
 * cluster-server.ts
 *
 * Port TypeScript al logicii de clustering din cluster.js, adaptat pentru
 * rulare în Next.js API Routes (Node.js runtime, nu Edge).
 * Importă algoritmul Dice/Jaccard din cluster.ts (shared cu frontend-ul).
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { titleSimilarity } from "./cluster";

export const SIMILARITY_THRESHOLD = 0.7;
export const WINDOW_HOURS = 12;

// ----------------------------------------------------------------
// Tipuri interne
// ----------------------------------------------------------------

interface ArticleRef {
  id: string;
  title: string;
  cluster_id: string;
}

interface NewArticle {
  id: string;
  title: string;
}

interface ClusterResult {
  clustered: number;
  created: number;
  errors: number;
}

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

async function fetchRecentClustered(supabase: SupabaseClient): Promise<ArticleRef[]> {
  const since = new Date(Date.now() - WINDOW_HOURS * 3_600_000).toISOString();
  const { data, error } = await supabase
    .from("articles")
    .select("id, title, cluster_id")
    .gte("published_at", since)
    .not("cluster_id", "is", null);

  if (error) throw new Error(`[cluster] Eroare fetch recent: ${error.message}`);
  return (data ?? []) as ArticleRef[];
}

function findBestCluster(
  newTitle: string,
  index: ArticleRef[]
): { clusterId: string | null; score: number } {
  let bestId: string | null = null;
  let bestScore = 0;

  for (const art of index) {
    const score = titleSimilarity(newTitle, art.title);
    if (score >= SIMILARITY_THRESHOLD && score > bestScore) {
      bestScore = score;
      bestId = art.cluster_id;
    }
  }
  return { clusterId: bestId, score: bestScore };
}

// ----------------------------------------------------------------
// Export principal
// ----------------------------------------------------------------

export async function clusterNewArticles(
  supabase: SupabaseClient,
  newArticles: NewArticle[]
): Promise<ClusterResult> {
  if (!newArticles.length) return { clustered: 0, created: 0, errors: 0 };

  let recent: ArticleRef[];
  try {
    recent = await fetchRecentClustered(supabase);
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    return { clustered: 0, created: 0, errors: newArticles.length };
  }

  // Index local — include articolele din același batch pentru cross-clustering
  const localIndex: ArticleRef[] = [...recent];
  let clustered = 0;
  let created = 0;
  let errors = 0;

  for (const article of newArticles) {
    const { clusterId } = findBestCluster(article.title, localIndex);
    // crypto.randomUUID() este disponibil în Node ≥ 15 și în Web Crypto API
    const assignedId = clusterId ?? crypto.randomUUID();

    if (clusterId) {
      clustered++;
    } else {
      created++;
    }

    const { error } = await supabase
      .from("articles")
      .update({ cluster_id: assignedId })
      .eq("id", article.id);

    if (error) {
      console.error(`[cluster] Update ${article.id}: ${error.message}`);
      errors++;
      continue;
    }

    localIndex.push({ id: article.id, title: article.title, cluster_id: assignedId });
  }

  return { clustered, created, errors };
}

// ----------------------------------------------------------------
// Factory pentru clientul Supabase cu service role (scriere)
// ----------------------------------------------------------------

export function createServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "[supabase] NEXT_PUBLIC_SUPABASE_URL sau SUPABASE_SERVICE_ROLE_KEY lipsesc."
    );
  }

  return createClient(url, key, { auth: { persistSession: false } });
}
