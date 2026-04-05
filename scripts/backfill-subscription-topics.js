/**
 * scripts/backfill-subscription-topics.js
 *
 * Populează câmpul `subscription_topic` pentru articolele existente care îl au NULL.
 * Rulează O SINGURĂ DATĂ (sau ori de câte ori apar articole noi fără topic).
 *
 * Utilizare:
 *   node scripts/backfill-subscription-topics.js
 *
 * Variabile de mediu necesare (din .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   ANTHROPIC_API_KEY
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
require("dotenv").config({ path: ".env.local" });

const { createClient } = require("@supabase/supabase-js");
const Anthropic = require("@anthropic-ai/sdk").default;

// ── Config ────────────────────────────────────────────────────────
const BATCH_SIZE = 50;       // articole per query Supabase
const DELAY_MS   = 300;      // pauză între apeluri AI (evită rate limit)
const MAX_ARTICLES = 100;    // limită totală (0 = fără limită)

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

// ── Extracție topic via Haiku ─────────────────────────────────────
async function extractTopic(title) {
  try {
    const msg = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 32,
      messages: [
        {
          role: "user",
          content: `Extrage UN SINGUR subiect de abonare din titlul știrii de mai jos, în ordinea priorităților:
1. Dacă apare un nume de persoană publică → numele complet (ex: "Marcel Ciolacu")
2. Dacă apare o țară, organizație sau instituție → entitatea (ex: "SUA", "NATO", "BNR")
3. Altfel → topicul principal în 1–3 cuvinte (ex: "prețul benzinei")

Titlu: ${title}

Răspunde DOAR cu string-ul, fără explicații, fără ghilimele.`,
        },
      ],
    });

    const raw = msg.content[0]?.type === "text" ? msg.content[0].text.trim() : null;
    return raw && raw.length > 0 && raw.length <= 60 ? raw : null;
  } catch (err) {
    console.warn(`  ⚠ AI error pentru "${title.slice(0, 50)}...": ${err.message}`);
    return null;
  }
}

// ── Main ──────────────────────────────────────────────────────────
async function main() {
  console.log("🔍  Număr articole fără subscription_topic...");

  const { count, error: countErr } = await supabase
    .from("articles")
    .select("id", { count: "exact", head: true })
    .is("subscription_topic", null);

  if (countErr) {
    console.error("❌  Eroare count:", countErr.message);
    process.exit(1);
  }

  const total = MAX_ARTICLES > 0 ? Math.min(count, MAX_ARTICLES) : count;
  console.log(`📰  ${count} articole fără topic în DB — procesăm primele ${total}\n`);

  let processed = 0;
  let updated   = 0;
  let failed    = 0;
  let offset    = 0;

  while (offset < total) {
    const { data: articles, error } = await supabase
      .from("articles")
      .select("id, title")
      .is("subscription_topic", null)
      .order("published_at", { ascending: false })
      .range(offset, offset + BATCH_SIZE - 1);

    if (error) {
      console.error("❌  Eroare fetch batch:", error.message);
      break;
    }
    if (!articles || articles.length === 0) break;

    for (const article of articles) {
      processed++;
      process.stdout.write(`  [${processed}/${total}] ${article.title.slice(0, 60)}... `);

      const topic = await extractTopic(article.title);

      if (topic) {
        const { error: updateErr } = await supabase
          .from("articles")
          .update({ subscription_topic: topic })
          .eq("id", article.id);

        if (updateErr) {
          console.log(`❌ update error: ${updateErr.message}`);
          failed++;
        } else {
          console.log(`✅ "${topic}"`);
          updated++;
        }
      } else {
        console.log("⏭  skip (topic null)");
        failed++;
      }

      // Pauză între apeluri AI
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }

    offset += articles.length;
  }

  console.log(`\n✅  Gata.`);
  console.log(`   Actualizate: ${updated}`);
  console.log(`   Eșuate/skip: ${failed}`);
  console.log(`   Total:       ${processed}`);
}

main().catch((err) => {
  console.error("❌  Eroare fatală:", err);
  process.exit(1);
});
