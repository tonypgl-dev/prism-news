import { NextRequest, NextResponse } from "next/server";
import { assertCron } from "@/lib/social-auth";
import { createServerClient } from "@/lib/supabase";
import { publishPagePost } from "@/lib/facebook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const denied = assertCron(request);
  if (denied) return denied;

  const supabase = createServerClient();
  const now = new Date().toISOString();

  const { data: rows, error } = await supabase
    .from("social_posts")
    .select("*")
    .eq("status", "scheduled")
    .lte("scheduled_at", now)
    .order("scheduled_at", { ascending: true })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results: { id: string; ok: boolean; error?: string }[] = [];

  for (const row of rows ?? []) {
    try {
      const result = await publishPagePost({
        message: row.content as string,
        link: (row.link as string) || undefined,
        imageUrl: (row.image_url as string) || undefined,
      });
      await supabase
        .from("social_posts")
        .update({
          status: "published",
          fb_post_id: result.id,
          published_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      results.push({ id: row.id as string, ok: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "unknown";
      await supabase.from("social_posts").update({ status: "failed" }).eq("id", row.id);
      results.push({ id: row.id as string, ok: false, error: msg });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
