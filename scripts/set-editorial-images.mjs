/**
 * Setează image_url pentru articole editoriale existente (thumbnail + copertă).
 * Imagini în public/stiri/ (ex. pasca.png, pastele.jpg)
 *
 * Rulare: node scripts/set-editorial-images.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, "../.env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const EDITORIAL_SOURCE_ID = "00000000-0000-0000-0001-000000000001";

/** Mapare subscription_topic (din DB) → cale publică imagine */
const TOPIC_IMAGES = [
  { subscription_topic: "pasca", image_url: "/stiri/pasca.png" },
  { subscription_topic: "paste", image_url: "/stiri/pastele.jpg" },
];

for (const { subscription_topic, image_url } of TOPIC_IMAGES) {
  const { data, error } = await supabase
    .from("articles")
    .update({ image_url })
    .eq("source_id", EDITORIAL_SOURCE_ID)
    .eq("subscription_topic", subscription_topic)
    .select("id, title");

  if (error) {
    console.error(`❌ ${subscription_topic}:`, error.message);
    continue;
  }
  if (!data?.length) {
    console.warn(`⚠️  Niciun rând pentru subscription_topic=${subscription_topic}`);
  } else {
    console.log(`✅ ${subscription_topic} → ${image_url}`, data.map((r) => r.title).join(" | "));
  }
}

console.log("\nGata. Verifică fișierele: public/stiri/pasca.png, public/stiri/pastele.jpg\n");
