import { NextRequest, NextResponse } from "next/server";

export function assertSocialAdmin(request: NextRequest): NextResponse | null {
  const expected = process.env.SOCIAL_ADMIN_SECRET?.trim();
  if (!expected) {
    return NextResponse.json(
      { error: "SOCIAL_ADMIN_SECRET nu este setat pe server." },
      { status: 503 }
    );
  }
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export function assertCron(request: NextRequest): NextResponse | null {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET missing" }, { status: 503 });
  }
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
