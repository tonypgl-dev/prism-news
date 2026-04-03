import { NextRequest, NextResponse } from "next/server";
import { assertSocialAdmin } from "@/lib/social-auth";
import { createServerClient } from "@/lib/supabase";
import { publishPagePost } from "@/lib/facebook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const denied = assertSocialAdmin(request);
  if (denied) return denied;

  const { id } = await ctx.params;
  const supabase = createServerClient();

  const { data: row, error: fetchErr } = await supabase
    .from("social_posts")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchErr || !row) {
    return NextResponse.json({ error: "Post negăsit" }, { status: 404 });
  }

  if (row.status === "published") {
    return NextResponse.json({ error: "Deja publicat" }, { status: 400 });
  }

  try {
    const result = await publishPagePost({
      message: row.content as string,
      link: (row.link as string) || undefined,
      imageUrl: (row.image_url as string) || undefined,
    });

    const { error: upErr } = await supabase
      .from("social_posts")
      .update({
        status: "published",
        fb_post_id: result.id,
        published_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, fb_post_id: result.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Eroare Facebook";
    await supabase.from("social_posts").update({ status: "failed" }).eq("id", id);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
