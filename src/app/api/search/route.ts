import { NextRequest, NextResponse } from "next/server";
import { searchArticles, searchArticlesCount } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  const extended = searchParams.get("extended") === "true";

  if (q.length < 2) {
    return NextResponse.json(
      { results: [], extended: false, total: 0, error: "Minim 2 caractere." },
      { status: 400 }
    );
  }

  const from = extended ? null : undefined;

  try {
    const [results, total] = await Promise.all([
      searchArticles({ query: q, from }),
      searchArticlesCount({ query: q, from }),
    ]);

    return NextResponse.json({
      results,
      extended,
      total,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Eroare căutare";
    console.error("[api/search]", message);
    return NextResponse.json(
      { results: [], extended, total: 0, error: message },
      { status: 500 }
    );
  }
}
