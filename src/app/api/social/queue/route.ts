import { NextRequest, NextResponse } from "next/server";
import { assertSocialAdmin } from "@/lib/social-auth";
import { createServerClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const denied = assertSocialAdmin(request);
  if (denied) return denied;

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("social_posts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ posts: data ?? [] });
}
