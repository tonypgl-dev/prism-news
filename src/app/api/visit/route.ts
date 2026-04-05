import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Total vizitatori înregistrați (agregat) — fără a scrie în DB; pentru afișare în navbar. */
export async function GET() {
  try {
    const supabase = createServerClient();
    const { count, error } = await supabase
      .from("visitors")
      .select("id", { count: "exact", head: true });
    if (error) {
      console.error("[visit GET]", error.message);
      return NextResponse.json({ total: 0 });
    }
    return NextResponse.json({ total: count ?? 0 });
  } catch (e) {
    console.error("[visit GET]", e);
    return NextResponse.json({ total: 0 });
  }
}

export async function POST(request: NextRequest) {
  let visitorId: string | undefined;

  try {
    const body = await request.json();
    visitorId = typeof body?.visitor_id === "string" ? body.visitor_id : undefined;
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  if (!visitorId || !/^[0-9a-f-]{36}$/.test(visitorId)) {
    return NextResponse.json({ error: "Invalid visitor_id" }, { status: 400 });
  }

  const supabase = createServerClient();

  // Upsert — ignoră dacă există deja
  await supabase
    .from("visitors")
    .upsert({ id: visitorId }, { onConflict: "id", ignoreDuplicates: true });

  // Count total vizitatori unici
  const { count } = await supabase
    .from("visitors")
    .select("id", { count: "exact", head: true });

  return NextResponse.json({ total: count ?? 0 });
}
