import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { email, message } = await req.json();

  if (!email || !message) {
    return NextResponse.json({ error: "Câmpuri lipsă." }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Email service neconfigurat." }, { status: 500 });
  }

  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from: "Prisma News Contact <onboarding@resend.dev>",
    to: "tonypgl@gmail.com",
    replyTo: email,
    subject: `Mesaj nou de la ${email}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px">
        <h2 style="color:#7c3aed">Mesaj nou — Prisma News</h2>
        <p><strong>De la:</strong> ${email}</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:12px 0"/>
        <p style="white-space:pre-wrap">${message}</p>
      </div>
    `,
  });

  if (error) {
    console.error("[contact]", error);
    return NextResponse.json({ error: "Eroare la trimitere." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
