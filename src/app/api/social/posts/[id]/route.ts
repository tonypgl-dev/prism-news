import { NextRequest, NextResponse } from "next/server";
import { assertSocialAdmin } from "@/lib/social-auth";
import { createServerClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const denied = assertSocialAdmin(request);
  if (denied) return denied;

  const { id } = await ctx.params;
  if (!id) {
    return NextResponse.json({ error: "id lipsă" }, { status: 400 });
  }

  let body: {
    content?: string;
    image_url?: string | null;
    link?: string | null;
    scheduled_at?: string | null;
    status?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalid" }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  if (typeof body.content === "string") patch.content = body.content;
  if (body.image_url !== undefined) patch.image_url = body.image_url;
  if (body.link !== undefined) patch.link = body.link;
  if (body.scheduled_at !== undefined) patch.scheduled_at = body.scheduled_at;
  if (typeof body.status === "string") patch.status = body.status;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nimic de actualizat" }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("social_posts")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ post: data });
}

export async function DELETE(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const denied = assertSocialAdmin(request);
  if (denied) return denied;

  const { id } = await ctx.params;
  const supabase = createServerClient();
  const { error } = await supabase.from("social_posts").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
