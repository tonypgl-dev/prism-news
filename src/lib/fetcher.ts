import RSSParser from "rss-parser";
import sanitizeHtml from "sanitize-html";
import Anthropic from "@anthropic-ai/sdk";
import { type SupabaseClient } from "@supabase/supabase-js";

// ----------------------------------------------------------------
// Tipuri
// ----------------------------------------------------------------

interface RssSource {
  id: string;
  name: string;
  rss_url: string;
  bias: "left" | "center" | "right";
}

interface NewArticle {
  id: string;
  title: string;
}

interface FeedResult {
  inserted: number;
  skipped: number;
  errors: number;
  newArticles: NewArticle[];
}

interface CycleStats {
  sources: number;
  inserted: number;
  skipped: number;
  feedErrors: number;
  aiGenerated: number;
  newArticles: NewArticle[];
}

interface AiSummaries {
  ai_pre_summary: string;
  ai_summary: string;
}

// ----------------------------------------------------------------
// Parser RSS
// ----------------------------------------------------------------

const parser = new RSSParser({
  timeout: 10_000,
  headers: { "User-Agent": "PrismNewsRO-Fetcher/1.0 (vercel-cron)" },
  customFields: {
    item: [["media:content", "media:content", { keepArray: false }]],
  },
});

// ----------------------------------------------------------------
// Client Anthropic (lazy — null dacă ANTHROPIC_API_KEY lipsește)
// ----------------------------------------------------------------

function getAnthropicClient(): Anthropic | null {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  return new Anthropic({ apiKey: key });
}

// ----------------------------------------------------------------
// Helpers RSS
// ----------------------------------------------------------------

function cleanSummary(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const text = sanitizeHtml(raw, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, " ")
    .trim();
  return text.length > 500 ? text.slice(0, 500) : text;
}

function extractOriginalSnippet(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const text = sanitizeHtml(raw, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, " ")
    .trim();
  return text.length > 280 ? text.slice(0, 277) + "…" : text || null;
}

function extractImageUrl(item: RSSParser.Item): string | null {
  const media = (item as Record<string, unknown>)["media:content"] as
    | { $: { url?: string } }
    | undefined;
  if (media?.$.url) return media.$.url;

  if (item.enclosure?.url && item.enclosure.type?.startsWith("image/")) {
    return item.enclosure.url;
  }

  const html =
    ((item as Record<string, unknown>)["content:encoded"] as string) ||
    (item.content ?? "") ||
    (item.summary ?? "");
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : null;
}

function parseDate(item: RSSParser.Item): string | null {
  const raw = item.pubDate ?? item.isoDate;
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

// ----------------------------------------------------------------
// Generare rezumate AI (Claude Haiku)
// ----------------------------------------------------------------

async function generateAiSummaries(
  client: Anthropic,
  title: string,
  snippet: string
): Promise<AiSummaries | null> {
  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: `Ești un editor de știri român. Pe baza titlului și fragmentului de mai jos, generează în română:
1. O propoziție de impact de maxim 15 cuvinte (the hook).
2. O sinteză neutră de context de 280-300 caractere care explică CE s-a întâmplat, fără să preia text din sursă.

Titlu: ${title}
Fragment: ${snippet}

Răspunde EXCLUSIV în formatul JSON:
{"pre": "propoziția scurtă", "summary": "sinteza neutră"}`,
        },
      ],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]) as { pre?: string; summary?: string };
    if (!parsed.pre || !parsed.summary) return null;

    return {
      ai_pre_summary: parsed.pre.slice(0, 120),
      ai_summary: parsed.summary.slice(0, 350),
    };
  } catch {
    return null;
  }
}

// ----------------------------------------------------------------
// Fetch surse
// ----------------------------------------------------------------

export async function fetchSources(supabase: SupabaseClient): Promise<RssSource[]> {
  const { data, error } = await supabase
    .from("sources")
    .select("id, name, rss_url, bias");
  if (error) throw new Error(`Eroare citire surse: ${error.message}`);
  return (data ?? []) as RssSource[];
}

// ----------------------------------------------------------------
// Procesare feed individual
// ----------------------------------------------------------------

async function processFeed(
  supabase: SupabaseClient,
  source: RssSource,
  anthropic: Anthropic | null
): Promise<FeedResult & { aiGenerated: number }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let feed: RSSParser.Output<any>;

  try {
    feed = await parser.parseURL(source.rss_url);
  } catch (err) {
    console.warn(`[${source.name}] Eroare parsare RSS:`, err);
    return { inserted: 0, skipped: 0, errors: 1, aiGenerated: 0, newArticles: [] };
  }

  if (!feed.items?.length) {
    return { inserted: 0, skipped: 0, errors: 0, aiGenerated: 0, newArticles: [] };
  }

  const rawArticles = feed.items
    .filter((item) => Boolean(item.link))
    .map((item) => {
      const rawText = item.contentSnippet ?? item.summary ?? item.content;
      return {
        source_id: source.id,
        title: (item.title ?? "").trim() || "(fără titlu)",
        summary: cleanSummary(rawText),
        original_snippet: extractOriginalSnippet(rawText),
        link: item.link!.trim(),
        image_url: extractImageUrl(item),
        published_at: parseDate(item) ?? new Date().toISOString(),
        bias: source.bias,
        ai_pre_summary: null as string | null,
        ai_summary: null as string | null,
      };
    });

  if (!rawArticles.length) return { inserted: 0, skipped: 0, errors: 0, aiGenerated: 0, newArticles: [] };

  // Generare AI pentru primele 3 articole din batch — secvențial (evită rate limit)
  let aiGenerated = 0;
  if (anthropic) {
    const AI_LIMIT = 3;
    for (const article of rawArticles.slice(0, AI_LIMIT).filter((a) => a.original_snippet)) {
      const result = await generateAiSummaries(anthropic, article.title, article.original_snippet!);
      if (result) {
        article.ai_pre_summary = result.ai_pre_summary;
        article.ai_summary = result.ai_summary;
        aiGenerated++;
      }
    }
  }

  const { data, error } = await supabase
    .from("articles")
    .upsert(rawArticles, { onConflict: "link", ignoreDuplicates: true })
    .select("id, title");

  if (error) {
    console.error(`[${source.name}] Eroare upsert:`, error.message);
    return { inserted: 0, skipped: rawArticles.length, errors: 1, aiGenerated, newArticles: [] };
  }

  const newArticles = (data ?? []) as NewArticle[];
  return {
    inserted: newArticles.length,
    skipped: rawArticles.length - newArticles.length,
    errors: 0,
    aiGenerated,
    newArticles,
  };
}

// ----------------------------------------------------------------
// Pas 3: AI prioritar pentru articole clusterate
// ----------------------------------------------------------------

async function generateAiForClustered(
  supabase: SupabaseClient,
  anthropic: Anthropic,
  newArticleIds: string[]
): Promise<number> {
  if (!newArticleIds.length) return 0;

  const { data: candidates, error } = await supabase
    .from("articles")
    .select("id, title, original_snippet, cluster_id")
    .in("id", newArticleIds)
    .not("cluster_id", "is", null)
    .is("ai_summary", null)
    .not("original_snippet", "is", null);

  if (error || !candidates?.length) return 0;

  // Sortăm: clustere cu mai multe articole primul
  const clusterSize: Record<string, number> = {};
  candidates.forEach((a) => {
    clusterSize[a.cluster_id!] = (clusterSize[a.cluster_id!] ?? 0) + 1;
  });
  const sorted = [...candidates].sort(
    (a, b) => (clusterSize[b.cluster_id!] ?? 0) - (clusterSize[a.cluster_id!] ?? 0)
  );

  const AI_PRIORITY_LIMIT = 20;
  let generated = 0;

  for (const article of sorted.slice(0, AI_PRIORITY_LIMIT)) {
    const result = await generateAiSummaries(anthropic, article.title, article.original_snippet!);
    if (result) {
      await supabase
        .from("articles")
        .update({ ai_summary: result.ai_summary, ai_pre_summary: result.ai_pre_summary })
        .eq("id", article.id);
      generated++;
    }
  }

  return generated;
}

// ----------------------------------------------------------------
// Ciclu complet de fetch
// ----------------------------------------------------------------

export async function runFetchCycle(supabase: SupabaseClient): Promise<CycleStats> {
  const sources = await fetchSources(supabase);

  if (!sources.length) {
    return { sources: 0, inserted: 0, skipped: 0, feedErrors: 0, aiGenerated: 0, newArticles: [] };
  }

  const anthropic = getAnthropicClient();
  if (!anthropic) {
    console.warn("[cron] ANTHROPIC_API_KEY lipsește — rezumatele AI vor fi omise.");
  }

  let inserted = 0;
  let skipped = 0;
  let feedErrors = 0;
  let aiGenerated = 0;
  const allNewArticles: NewArticle[] = [];

  const CONCURRENCY = 5;
  for (let i = 0; i < sources.length; i += CONCURRENCY) {
    const batch = sources.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map((s) => processFeed(supabase, s, anthropic))
    );
    for (const r of results) {
      inserted += r.inserted;
      skipped += r.skipped;
      feedErrors += r.errors;
      aiGenerated += r.aiGenerated;
      allNewArticles.push(...r.newArticles);
    }
  }

  // Pas 3: AI prioritar pentru articole clusterate
  let aiPriority = 0;
  if (anthropic && allNewArticles.length > 0) {
    const ids = allNewArticles.map((a) => a.id);
    aiPriority = await generateAiForClustered(supabase, anthropic, ids);
    if (aiPriority > 0) {
      console.log(`[ai-priority] ✓ ${aiPriority} rezumate AI generate pentru știri clusterate`);
    }
  }

  return {
    sources: sources.length,
    inserted,
    skipped,
    feedErrors,
    aiGenerated: aiGenerated + aiPriority,
    newArticles: allNewArticles,
  };
}
