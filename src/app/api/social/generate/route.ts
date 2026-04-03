import { NextRequest, NextResponse } from "next/server";
import { assertSocialAdmin } from "@/lib/social-auth";
import { fetchArticlesByClusterId, createServerClient } from "@/lib/supabase";
import { buildClusterRows } from "@/lib/cluster";
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

export async function POST(request: NextRequest) {
  const denied = assertSocialAdmin(request);
  if (denied) return denied;

  let body: { cluster_id?: string; scheduled_at?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalid" }, { status: 400 });
  }

  const clusterId = body.cluster_id?.trim();
  if (!clusterId) {
    return NextResponse.json({ error: "cluster_id lipsă" }, { status: 400 });
  }

  const articles = await fetchArticlesByClusterId(clusterId);
  if (articles.length === 0) {
    return NextResponse.json({ error: "Nu există articole pentru cluster" }, { status: 404 });
  }

  const rows = buildClusterRows(articles);
  const row = rows.find((r) => r.cluster_id === clusterId) ?? rows[0];
  if (!row) {
    return NextResponse.json({ error: "Cluster invalid" }, { status: 400 });
  }

  const content = await generateFacebookPostCopy(row);
  const image_url = pickRowImageUrl(row);
  const link = pickRowLink(row, siteBase());

  const scheduled_at = body.scheduled_at?.trim() || null;
  const status = scheduled_at ? "scheduled" : "draft";

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("social_posts")
    .insert({
      cluster_id: clusterId,
      platform: "facebook",
      content,
      image_url,
      link,
      status,
      scheduled_at: scheduled_at || null,
    })
    .select()
    .single();

  if (error) {
    console.error("[social/generate]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ post: data });
}
