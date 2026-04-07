/**
 * scripts/generate-ai-for-article.js <article_id>
 *
 * Forțează generarea rezumatului AI pentru un articol specific.
 *
 * Utilizare:
 *   node scripts/generate-ai-for-article.js 8aacf64a-ef8a-4d99-96fc-6b7db04d5717
 */

require("dotenv").config({ path: ".env.local" });

const { createClient } = require("@supabase/supabase-js");
const Anthropic = require("@anthropic-ai/sdk").default;

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌  Lipsesc variabilele Supabase în .env.local");
  process.exit(1);
}
if (!ANTHROPIC_KEY) {
  console.error("❌  Lipsește ANTHROPIC_API_KEY în .env.local");
  process.exit(1);
}

const articleId = process.argv[2];
if (!articleId) {
  console.error("❌  Furnizează un article_id ca argument:\n   node scripts/generate-ai-for-article.js <id>");
  process.exit(1);
}

const supabase  = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY });

async function main() {
  // Fetch articol
  const { data: article, error } = await supabase
    .from("articles")
    .select("id, title, original_snippet, ai_pre_summary, ai_summary")
    .eq("id", articleId)
    .single();

  if (error || !article) {
    console.error("❌  Articolul nu a fost găsit:", error?.message ?? "id invalid");
    process.exit(1);
  }

  console.log(`📰  Titlu: ${article.title}`);

  if (article.ai_summary) {
    console.log(`ℹ️   Articolul are deja rezumat AI:`);
    console.log(`    Sinteză: ${article.ai_summary}`);
    console.log("");
    process.stdout.write("Vrei să suprascrieți? (y/N): ");
    const answer = await new Promise((resolve) => {
      process.stdin.once("data", (d) => resolve(d.toString().trim().toLowerCase()));
    });
    if (answer !== "y") { console.log("Anulat."); process.exit(0); }
  }

  if (!article.original_snippet) {
    console.error("❌  Articolul nu are original_snippet — AI nu poate genera fără fragment sursă.");
    process.exit(1);
  }

  console.log("🤖  Generez rezumat AI...");

  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4096,
    messages: [{
      role: "user",
      content: `Ești un editor de știri român. Pe baza titlului și fragmentului de mai jos, generează în română:
1. O singură sinteză neutră care explică clar CE s-a întâmplat, contextul relevant și de ce contează, fără a copia formulări din sursă. Nu repeta sau reformula titlul ca propoziție separată de tip „lead”.
2. UN SINGUR subiect de abonare: (a) persoană publică → numele complet; (b) țară/org/instituție → entitatea; (c) altfel → topic 1–3 cuvinte.

Titlu: ${article.title}
Fragment: ${article.original_snippet}

Răspunde EXCLUSIV în formatul JSON:
{"summary": "sinteza neutră", "topic": "subiect abonare"}`,
    }],
  });

  const raw = msg.content[0]?.type === "text" ? msg.content[0].text : "";
  const match = raw.match(/\{[\s\S]*?\}(?=\s*`|\s*$)/) ?? raw.match(/\{[\s\S]*\}/);
  if (!match) { console.error("❌  AI nu a returnat JSON valid:\n", raw); process.exit(1); }

  const parsed = JSON.parse(match[0]);
  if (!parsed.summary || !String(parsed.summary).trim()) {
    console.error("❌  AI nu a returnat câmpul summary în JSON.");
    process.exit(1);
  }
  console.log(`\n✅  Rezultat:`);
  console.log(`   Sinteză: ${parsed.summary}`);
  console.log(`   Topic:   ${parsed.topic}`);

  const { error: updateErr } = await supabase
    .from("articles")
    .update({
      ai_pre_summary: null,
      ai_summary: parsed.summary ?? null,
      subscription_topic: parsed.topic ?? null,
    })
    .eq("id", articleId);

  if (updateErr) {
    console.error("❌  Eroare la salvare:", updateErr.message);
    process.exit(1);
  }

  console.log("\n✅  Salvat în DB.");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌  Eroare fatală:", err);
  process.exit(1);
});
