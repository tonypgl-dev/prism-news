import { NextRequest, NextResponse } from "next/server";
import { FEED_FROM_ALL } from "@/lib/feed-from";
import { fetchArticlesPaginated } from "@/lib/supabase";
import { buildClusterRows } from "@/lib/cluster";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const offset = parseInt(searchParams.get("offset") ?? "0", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "10", 10), 50);
  const fromParam = searchParams.get("from");
  const from =
    fromParam === null
      ? new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      : fromParam === FEED_FROM_ALL
        ? undefined
        : fromParam;

  const { articles, total } = await fetchArticlesPaginated({ limit, offset, from });
  const rows = buildClusterRows(articles);

  return NextResponse.json({ rows, total, offset, limit });
}
