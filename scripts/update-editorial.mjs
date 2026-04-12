/**
 * Script: update-editorial.mjs
 * Actualizează titlul și/sau content_html al unui articol editorial existent.
 *
 * Rulare: node scripts/update-editorial.mjs
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

function readHtml(relativePath) {
  const raw = fs.readFileSync(path.join(__dirname, relativePath), "utf-8");
  const bodyMatch = raw.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return (bodyMatch ? bodyMatch[1] : raw)
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .trim();
}

async function updateArticle(id, fields) {
  const { error } = await supabase.from("articles").update(fields).eq("id", id);
  if (error) {
    console.error(`❌ Eroare update ${id}:`, error.message);
    return false;
  }
  console.log(`✅ Actualizat: ${id} — ${fields.title ?? "(fără titlu nou)"}`);
  return true;
}

// ── Articol 1: Pasca ────────────────────────────────────────────────────────
await updateArticle("08a3ee36-bf70-49f0-b1b0-c942edb77c61", {
  title:          "Învață secretele astea ca să nu ți se mai ardă pasca pe fund",
  summary:        "De ce se arde pasca pe fund deși urmezi rețeta pas cu pas? Răspunsul e în fizică și chimie. Explicație completă cu 7 soluții practice garantate.",
  ai_pre_summary: "De ce se arde pasca pe fund — explicat prin fizică și chimie, cu 7 soluții practice garantate.",
  content_html:   readHtml("../public/stiri/gospodarie/pasca-site.html"),
  image_url:      "/stiri/pasca.png",
});

// ── Articol 2: Paștele românesc ─────────────────────────────────────────────
await updateArticle("e45e41e6-c32d-400c-bc0f-922b1991acb2", {
  image_url: "/stiri/pastele.jpg",
});
