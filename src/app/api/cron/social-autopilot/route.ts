import { NextRequest, NextResponse } from "next/server";
import { assertCron } from "@/lib/social-auth";
import { createServerClient, fetchLatestArticles } from "@/lib/supabase";
import { buildClusterRows } from "@/lib/cluster";
import type { ClusterRow } from "@/types";
import { isBlindspot } from "@/lib/utils";
import {
  generateFacebookPostCopy,
  pickRowImageUrl,
  pickRowLink,
} from "@/lib/social-copy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function siteBase(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://prisma-news.ro"
  );
}

function scoreRow(row: ClusterRow): number {
  let s = 0;
  if (row.left) s += 2;
  if (row.center) s += 2;
  if (row.right) s += 2;
  if (isBlindspot(row)) s += 4;
  return s;
}

function nextScheduledSlots(count: number): string[] {
  const out: string[] = [];
  let t = Date.now() + 60 * 60 * 1000;
  for (let i = 0; i < count; i++) {
    out.push(new Date(t).toISOString());
    t += 2 * 60 * 60 * 1000;
  }
  return out;
}

export async function GET(request: NextRequest) {
  const denied = assertCron(request);
  if (denied) return denied;

  const supabase = createServerClient();

  const { data: settings } = await supabase
    .from("social_settings")
    .select("autopilot")
    .eq("id", 1)
    .maybeSingle();

  if (!settings?.autopilot) {
    return NextResponse.json({ skipped: true, reason: "autopilot_off" });
  }

  const from = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const articles = await fetchLatestArticles({ limit: 400, offset: 0, from });
  const rows = buildClusterRows(articles);

  const { data: recent } = await supabase
    .from("social_posts")
    .select("cluster_id, created_at")
    .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

  const busy = new Set(
    (recent ?? [])
      .map((r) => r.cluster_id as string | null)
      .filter(Boolean) as string[]
  );

  const ranked = [...rows]
    .filter((r) => r.cluster_id && !busy.has(r.cluster_id))
    .sort((a, b) => scoreRow(b) - scoreRow(a))
    .slice(0, 10);

  const slots = nextScheduledSlots(ranked.length);
  const base = siteBase();
  let created = 0;
  const errors: string[] = [];

  for (let i = 0; i < ranked.length; i++) {
    const row = ranked[i];
    try {
      const content = await generateFacebookPostCopy(row);
      const image_url = pickRowImageUrl(row);
      const link = pickRowLink(row, base);
      const { error } = await supabase.from("social_posts").insert({
        cluster_id: row.cluster_id,
        platform: "facebook",
        content,
        image_url,
        link,
        status: "scheduled",
        scheduled_at: slots[i],
      });
      if (error) errors.push(error.message);
      else created++;
    } catch (e) {
      errors.push(e instanceof Error ? e.message : "unknown");
    }
  }

  return NextResponse.json({ created, errors });
}
