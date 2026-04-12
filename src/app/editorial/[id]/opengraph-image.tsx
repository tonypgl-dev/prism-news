import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { fetchEditorialArticleById } from "@/lib/supabase";
import { CATEGORY_MAP } from "@/lib/editorial-categories";
import { loadGoogleFontWoff2 } from "@/lib/og-fonts";

export const runtime = "edge";

export const alt = "Prisma News — Articol editorial";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Primul <p> din HTML — același model ca în EditorialCard. */
function firstParagraphPlain(html: string | null | undefined): string {
  if (!html) return "";
  const m = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  if (!m) return "";
  return m[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function truncate(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trim()}…`;
}

function absoluteAssetUrl(path: string | null | undefined): string | null {
  if (!path?.trim()) return null;
  const p = path.trim();
  if (p.startsWith("http://") || p.startsWith("https://")) return p;
  const vercel = process.env.VERCEL_URL;
  const base = (
    process.env.NEXT_PUBLIC_SITE_URL ??
    (vercel ? `https://${vercel.replace(/^https?:\/\//, "")}` : null) ??
    "https://prisma-news.ro"
  ).replace(/\/$/, "");
  return `${base}${p.startsWith("/") ? p : `/${p}`}`;
}

function secondaryLine(article: {
  ai_pre_summary: string | null;
  content_html: string | null;
  summary: string | null;
}): string {
  if (article.ai_pre_summary?.trim()) return article.ai_pre_summary.trim();
  const fromHtml = firstParagraphPlain(article.content_html);
  if (fromHtml) return fromHtml;
  return article.summary?.trim() ?? "";
}

type Props = { params: Promise<{ id: string }> };

export default async function Image({ params }: Props) {
  const { id } = await params;
  const article = await fetchEditorialArticleById(id);
  if (!article) notFound();

  const cat = article.category ? CATEGORY_MAP[article.category] : null;
  const accent = cat?.accent ?? "#C8963E";
  const fallbackBg = cat?.hero[0] ?? "#0f172a";

  const title = article.title || "Prisma News";
  const subtitle = secondaryLine(article);
  const coverAbs = absoluteAssetUrl(article.image_url);

  let inter400: ArrayBuffer | undefined;
  let inter700: ArrayBuffer | undefined;
  let playfair700: ArrayBuffer | undefined;
  try {
    const loaded = await Promise.all([
      loadGoogleFontWoff2("Inter", 400),
      loadGoogleFontWoff2("Inter", 700),
      loadGoogleFontWoff2("Playfair Display", 700),
    ]);
    inter400 = loaded[0];
    inter700 = loaded[1];
    playfair700 = loaded[2];
  } catch {
    // ImageResponse folosește fonturi de sistem dacă lipsește încărcarea
  }

  const fonts =
    inter400 && inter700 && playfair700
      ? [
          { name: "Inter", data: inter400, weight: 400 as const, style: "normal" as const },
          { name: "Inter", data: inter700, weight: 700 as const, style: "normal" as const },
          { name: "Playfair Display", data: playfair700, weight: 700 as const, style: "normal" as const },
        ]
      : [];

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          position: "relative",
          backgroundColor: fallbackBg,
        }}
      >
        {coverAbs ? (
          // eslint-disable-next-line @next/next/no-img-element -- next/og ImageResponse
          <img
            alt=""
            src={coverAbs}
            width={1200}
            height={630}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : null}

        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.55) 42%, rgba(0,0,0,0.9) 100%)",
          }}
        />

        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            flex: 1,
            padding: 52,
            justifyContent: "space-between",
            zIndex: 1,
          }}
        >
          <div
            style={{
              fontFamily: "Inter",
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.28em",
              color: accent,
              textTransform: "uppercase",
            }}
          >
            ✦ PRISM NEWS EDITORIAL
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              flex: 1,
              gap: 22,
              maxWidth: 1080,
              marginTop: 8,
            }}
          >
            <div
              style={{
                fontFamily: "Playfair Display",
                fontSize: 62,
                fontWeight: 700,
                color: "#fff",
                lineHeight: 1.12,
                letterSpacing: "-0.02em",
              }}
            >
              {truncate(title, 120)}
            </div>

            {subtitle ? (
              <div
                style={{
                  fontFamily: "Inter",
                  fontSize: 30,
                  fontWeight: 400,
                  color: "rgba(255,255,255,0.85)",
                  lineHeight: 1.38,
                  overflow: "hidden",
                  maxHeight: 132,
                }}
              >
                {truncate(subtitle, 240)}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts,
    }
  );
}
