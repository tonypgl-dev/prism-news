import { NextRequest, NextResponse } from "next/server";
import { assertSocialAdmin } from "@/lib/social-auth";
import { fetchLatestArticles } from "@/lib/supabase";
import { buildClusterRows } from "@/lib/cluster";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const denied = assertSocialAdmin(request);
  if (denied) return denied;

  const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const articles = await fetchLatestArticles({ limit: 400, offset: 0, from });
  const rows = buildClusterRows(articles);

  return NextResponse.json({ rows: rows.slice(0, 100) });
}
