/**
 * scripts/backfill-ai-summaries.js
 *
 * Generează ai_pre_summary + ai_summary + subscription_topic pentru articolele
 * recente care le au NULL (ex: perioadă când ANTHROPIC_API_KEY era dezactivat).
 *
 * Utilizare:
 *   node scripts/backfill-ai-summaries.js
 *
 * Variabile de mediu necesare (din .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   ANTHROPIC_API_KEY
 */

require("dotenv").config({ path: ".env.local" });

const { createClient } = require("@supabase/supabase-js");
const Anthropic = require("@anthropic-ai/sdk").default;

// ── Config ────────────────────────────────────────────────────────
const DAYS_BACK    = 3;    // câte zile înapoi să procesăm
const DELAY_MS     = 350;  // pauză între apeluri AI (evită rate limit)
const MAX_ARTICLES = 150;  // limită de siguranță (0 = fără limită)

// ── Validare env ──────────────────────────────────────────────────
const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌  Lipsesc NEXT_PUBLIC_SUPABASE_URL sau SUPABASE_SERVICE_ROLE_KEY în .env.local");
  process.exit(1);
}
if (!ANTHROPIC_KEY) {
  console.error("❌  Lipsește ANTHROPIC_API_KEY în .env.local");
  process.exit(1);
}

const supabase  = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY });

// ── Generare rezumate AI ──────────────────────────────────────────
async function generateSummaries(title, snippet) {
  try {
    const msg = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: `Ești un editor de știri român. Pe baza titlului și fragmentului de mai jos, generează în română:
1. O propoziție de impact scurtă (hook) care captează esența știrii.
2. O sinteză neutră care explică clar CE s-a întâmplat, contextul relevant și de ce contează, fără a copia formulări din sursă.
3. UN SINGUR subiect de abonare: (a) persoană publică → numele complet; (b) țară/org/instituție → entitatea; (c) altfel → topic 1–3 cuvinte.

Titlu: ${title}
Fragment: ${snippet}

Răspunde EXCLUSIV în formatul JSON:
{"pre": "propoziția scurtă", "summary": "sinteza neutră", "topic": "subiect abonare"}`,
        },
      ],
    });

    const raw = msg.content[0]?.type === "text" ? msg.content[0].text : "";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;

    const parsed = JSON.parse(match[0]);
    if (!parsed.pre || !parsed.summary) return null;

    return {
      ai_pre_summary: parsed.pre.trim() || null,
      ai_summary: parsed.summary.trim() || null,
      subscription_topic: (parsed.topic ?? "").trim() || null,
    };
  } catch (err) {
    console.warn(`  ⚠ AI error: ${err.message}`);
    return null;
  }
}

// ── Main ──────────────────────────────────────────────────────────
async function main() {
  const fromDate = new Date(Date.now() - DAYS_BACK * 24 * 60 * 60 * 1000).toISOString();
  console.log(`🔍  Articole fără AI din ultimele ${DAYS_BACK} zile (după ${fromDate.slice(0, 10)})...\n`);

  const { data: articles, error } = await supabase
    .from("articles")
    .select("id, title, original_snippet")
    .is("ai_summary", null)
    .not("original_snippet", "is", null)
    .gte("published_at", fromDate)
    .order("published_at", { ascending: false })
    .limit(MAX_ARTICLES > 0 ? MAX_ARTICLES : 10000);

  if (error) {
    console.error("❌  Eroare fetch:", error.message);
    process.exit(1);
  }

  if (!articles?.length) {
    console.log("✅  Nu există articole fără rezumat AI în intervalul selectat.");
    return;
  }

  console.log(`📰  ${articles.length} articole de procesat\n`);

  let updated = 0;
  let failed  = 0;

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    process.stdout.write(`  [${i + 1}/${articles.length}] ${article.title.slice(0, 65)}... `);

    const result = await generateSummaries(article.title, article.original_snippet);

    if (result) {
      const { error: updateErr } = await supabase
        .from("articles")
        .update(result)
        .eq("id", article.id);

      if (updateErr) {
        console.log(`❌ ${updateErr.message}`);
        failed++;
      } else {
        console.log(`✅`);
        updated++;
      }
    } else {
      console.log("⏭  skip");
      failed++;
    }

    await new Promise((r) => setTimeout(r, DELAY_MS));
  }

  console.log(`\n✅  Gata.`);
  console.log(`   Actualizate: ${updated}`);
  console.log(`   Eșuate/skip: ${failed}`);
}

main().catch((err) => {
  console.error("❌  Eroare fatală:", err);
  process.exit(1);
});
