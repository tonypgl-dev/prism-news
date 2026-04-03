/**
 * GET /api/cron/fetch
 *
 * Rută invocată periodic de Vercel Cron (configurat în vercel.json).
 * Pași:
 *  1. Verifică Bearer token (CRON_SECRET) — respinge apelurile neautorizate.
 *  2. Fetch RSS de la toate sursele din Supabase.
 *  3. Upsert articole noi (ignoră duplicate după `link`).
 *  4. Rulează clustering Dice/Jaccard pe articolele nou inserate.
 *  5. Returnează statistici JSON.
 *
 * Notă: ruta rulează pe Node.js runtime (nu Edge) din cauza
 *       dependențelor rss-parser și sanitize-html.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, clusterNewArticles } from "@/lib/cluster-server";
import { runFetchCycle } from "@/lib/fetcher";

// Forțează Node.js runtime (rss-parser nu rulează în Edge)
export const runtime = "nodejs";

// Dezactivează cache-ul pentru această rută
export const dynamic = "force-dynamic";

// ----------------------------------------------------------------
// Verificare autorizare
// ----------------------------------------------------------------

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // Dacă secretul nu e configurat, blocăm orice apel în producție
    console.warn("[cron] CRON_SECRET nu este setat — acces refuzat.");
    return false;
  }

  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${secret}`;
}

// ----------------------------------------------------------------
// Handler GET
// ----------------------------------------------------------------

export async function GET(request: NextRequest) {
  // ── 1. Autorizare ──────────────────────────────────────────────
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const startedAt = Date.now();
  console.log(`[cron] ▶ Pornire ciclu fetch — ${new Date().toISOString()}`);

  let supabase;
  try {
    supabase = createServiceClient();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Supabase init error";
    console.error("[cron]", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }

  // ── 2. Fetch RSS + upsert articole ─────────────────────────────
  let cycleStats;
  try {
    cycleStats = await runFetchCycle(supabase);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Fetch cycle error";
    console.error("[cron] Eroare ciclu fetch:", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }

  console.log(
    `[cron] Fetch: ${cycleStats.inserted} inserate | ${cycleStats.skipped} duplicate | ${cycleStats.feedErrors} erori surse | ${cycleStats.aiGenerated} rezumate AI`
  );

  // ── 3. Clustering articole noi ─────────────────────────────────
  let clusterStats = { clustered: 0, created: 0, errors: 0 };
  if (cycleStats.newArticles.length > 0) {
    console.log(`[cron] Clustering ${cycleStats.newArticles.length} articole noi…`);
    try {
      clusterStats = await clusterNewArticles(supabase, cycleStats.newArticles);
    } catch (err) {
      console.error("[cron] Eroare clustering:", err);
      // Nu returnăm eroare fatală — articolele au fost inserate, doar clustering a eșuat
    }
  }

  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);

  console.log(
    `[cron] ✓ Complet în ${elapsed}s — clustere asociate: ${clusterStats.clustered}, noi: ${clusterStats.created}`
  );

  // ── 4. Răspuns JSON cu statistici ─────────────────────────────
  return NextResponse.json(
    {
      success: true,
      elapsed_s: parseFloat(elapsed),
      fetch: {
        sources: cycleStats.sources,
        inserted: cycleStats.inserted,
        skipped: cycleStats.skipped,
        errors: cycleStats.feedErrors,
        ai_generated: cycleStats.aiGenerated,
      },
      clusters: {
        associated: clusterStats.clustered,
        created: clusterStats.created,
        errors: clusterStats.errors,
      },
    },
    { status: 200 }
  );
}
