/**
 * Încarcă fonturi Google (woff2) pentru ImageResponse / next/og.
 * Folosit în Edge runtime — doar fetch.
 */
export async function loadGoogleFontWoff2(
  family: string,
  weight: number
): Promise<ArrayBuffer> {
  const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
    family.replace(/ /g, "+")
  )}:wght@${weight}&display=swap`;
  const css = await fetch(cssUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  }).then((r) => r.text());
  const m = css.match(/url\(([^)]+)\)\s+format\(['"]woff2['"]\)/);
  if (!m) {
    throw new Error(`[og-fonts] Nu s-a găsit woff2 pentru ${family} ${weight}`);
  }
  let fontUrl = m[1].replace(/['"]/g, "").trim();
  if (fontUrl.startsWith("//")) fontUrl = `https:${fontUrl}`;
  else if (!fontUrl.startsWith("http")) fontUrl = `https://fonts.gstatic.com/${fontUrl.replace(/^\//, "")}`;
  return fetch(fontUrl).then((r) => r.arrayBuffer());
}
