/**
 * Script: insert-editorial.mjs
 * Inserează un articol editorial Prism News în DB.
 *
 * Rulare: node scripts/insert-editorial.mjs
 *
 * Prereq SQL (rulează o singură dată în Supabase SQL Editor):
 *   ALTER TABLE articles ADD COLUMN IF NOT EXISTS category TEXT;
 *   ALTER TABLE articles ADD COLUMN IF NOT EXISTS content_html TEXT;
 *   INSERT INTO sources (id, name, rss_url, bias, logo_url)
 *     VALUES ('00000000-0000-0000-0001-000000000001', 'Prism News Editorial', 'https://prisma-news.ro/editorial', 'center', null)
 *   ON CONFLICT (id) DO NOTHING;
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, "../.env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const EDITORIAL_SOURCE_ID = "00000000-0000-0000-0001-000000000001";

// ── Citim HTML-ul sursă ──────────────────────────────────────────────
const htmlPath = path.join(
  __dirname,
  "../public/stiri/cultura/pastele-romanesc-semnificatie-traditii.html"
);
const rawHtml = fs.readFileSync(htmlPath, "utf-8");

// Document complet: extragem interiorul <body>. Fragment (fără <body>): folosim fișierul ca atare.
const bodyMatch = rawHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
let bodyHtml = bodyMatch ? bodyMatch[1] : rawHtml;
bodyHtml = bodyHtml.replace(/<script[\s\S]*?<\/script>/gi, "").trim();

// ── Articol ──────────────────────────────────────────────────────────
const article = {
  source_id: EDITORIAL_SOURCE_ID,
  title: "Paștele românesc: semnificația, tradițiile și magia unei sărbători care ne unește",
  summary:
    "Ce înseamnă cu adevărat Paștele pentru români, de unde vine cuvântul, ce simbolizează fiecare tradiție și cum se sărbătorește Învierea în diferitele colțuri ale țării.",
  link: "/editorial/pending",
  image_url: "/stiri/pastele.jpg",
  published_at: new Date().toISOString(),
  bias: "center",
  cluster_id: null,
  ai_pre_summary:
    "Semnificația Paștelui românesc — de la originea cuvântului până la tradițiile unice care ne deosebesc în lume.",
  ai_summary: null,
  subscription_topic: "paste",
  category: "cultura",
  content_html: bodyHtml,
};

// ── Inserție ──────────────────────────────────────────────────────────
const { data, error } = await supabase
  .from("articles")
  .insert(article)
  .select("id")
  .single();

if (error) {
  console.error("❌ Eroare inserție:", error.message);
  process.exit(1);
}

const id = data.id;
console.log(`✅ Articol inserat cu ID: ${id}`);

// Actualizăm link-ul cu ID-ul generat
const { error: updateError } = await supabase
  .from("articles")
  .update({ link: `/editorial/${id}` })
  .eq("id", id);

if (updateError) {
  console.warn("⚠️  Link neactualizat:", updateError.message);
} else {
  console.log(`✅ Link setat: /editorial/${id}`);
  console.log(`\n🔗 Accesibil la: https://prisma-news.ro/editorial/${id}\n`);
}
