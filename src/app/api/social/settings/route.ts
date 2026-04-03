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
    .from("social_settings")
    .select("autopilot, updated_at")
    .eq("id", 1)
    .maybeSingle();

  if (error?.code === "PGRST116" || error?.message?.includes("does not exist")) {
    return NextResponse.json({ autopilot: false, updated_at: null });
  }
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    autopilot: data?.autopilot ?? false,
    updated_at: data?.updated_at ?? null,
  });
}

export async function PATCH(request: NextRequest) {
  const denied = assertSocialAdmin(request);
  if (denied) return denied;

  let body: { autopilot?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalid" }, { status: 400 });
  }

  if (typeof body.autopilot !== "boolean") {
    return NextResponse.json({ error: "autopilot boolean necesar" }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("social_settings")
    .upsert(
      { id: 1, autopilot: body.autopilot, updated_at: new Date().toISOString() },
      { onConflict: "id" }
    )
    .select()
    .single();

  if (error) {
    if (error.message.includes("does not exist") || error.code === "42P01") {
      return NextResponse.json(
        {
          error:
            "Tabela social_settings nu există. Rulează social_settings.sql în Supabase.",
        },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ settings: data });
}
