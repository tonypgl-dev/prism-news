/**
 * editorial-categories.ts
 * Sursa de adevăr pentru toate categoriile editoriale Prism News.
 *
 * Folosit în:
 *   - src/app/editorial/[id]/page.tsx  (CSS per categorie, labels)
 *   - src/components/EditorialCard.tsx  (culori card în feed)
 *   - scripts/insert-editorial.mjs       (validare categorie la inserție)
 *   - categorii.md                      (documentație editorială)
 */

export interface EditorialCategory {
  slug: string;
  label: string;
  /** Slug-ul categoriei părinte, dacă e subcategorie. */
  parent?: string;
  /** Culoarea principală de accent (hex). Folosită pe bara cardului, headings, accente. */
  accent: string;
  /** Versiune mai deschisă a accentului pentru dark mode. */
  accentDark: string;
  /** Gradientul hero: [from, mid, to] — culori hex. */
  hero: [string, string, string];
  /** Culoare de fundal pentru secțiunea de tips (light mode). */
  tipsBg: string;
  /** Culoare de fundal pentru secțiunea de tips (dark mode). */
  tipsBgDark: string;
  /** Culoare text accent în tips (numerele, heading-ul). */
  tipsColor: string;
  tipsColorDark: string;
  /** Scurtă descriere editorială — ce articole se publică în categorie. */
  description: string;
}

export const EDITORIAL_CATEGORIES: EditorialCategory[] = [
  {
    slug: "gospodarie",
    label: "Gospodărie",
    accent: "#C8963E",
    accentDark: "#D4A857",
    hero: ["#2d1f18", "#4a3428", "#5c4336"],
    tipsBg: "#f5f0e8",
    tipsBgDark: "#1a1512",
    tipsColor: "#5c3d2e",
    tipsColorDark: "#b08030",
    description: "Sfaturi practice pentru casă, curățenie, organizare, bricolaj și viața de zi cu zi acasă.",
  },
  {
    slug: "retete",
    label: "Rețete",
    parent: "gospodarie",
    accent: "#DC4A1A",
    accentDark: "#F06030",
    hero: ["#3d1a0a", "#6b2d1a", "#8b3a1a"],
    tipsBg: "#fef2ec",
    tipsBgDark: "#1a0e08",
    tipsColor: "#9a2d12",
    tipsColorDark: "#e05a30",
    description: "Rețete culinare românești și internaționale, tehnici de gătit, ingrediente de sezon.",
  },
  {
    slug: "sanatate",
    label: "Sănătate",
    accent: "#16A34A",
    accentDark: "#22C55E",
    hero: ["#0a2318", "#0f3d25", "#1a5c35"],
    tipsBg: "#ecfdf5",
    tipsBgDark: "#071a0f",
    tipsColor: "#166534",
    tipsColorDark: "#22c55e",
    description: "Sănătate preventivă, nutriție, medicină explicată simplu, sfaturi pentru un stil de viață sănătos.",
  },
  {
    slug: "economie",
    label: "Bani & Economie",
    accent: "#4D7C0F",
    accentDark: "#84CC16",
    hero: ["#1a2a0a", "#2d4a12", "#3d6018"],
    tipsBg: "#f7fee7",
    tipsBgDark: "#0f1a05",
    tipsColor: "#365314",
    tipsColorDark: "#84cc16",
    description: "Educație financiară, investiții, economisire, piața muncii, inflație explicată pe înțelesul tuturor.",
  },
  {
    slug: "auto",
    label: "Auto",
    accent: "#1D4ED8",
    accentDark: "#3B82F6",
    hero: ["#0a1628", "#1a2d4a", "#0f1e3d"],
    tipsBg: "#eff6ff",
    tipsBgDark: "#050d1a",
    tipsColor: "#1e40af",
    tipsColorDark: "#3b82f6",
    description: "Teste auto, sfaturi pentru șoferi, legislație rutieră, mașini electrice, întreținere.",
  },
  {
    slug: "tech",
    label: "Tech & AI",
    accent: "#7C3AED",
    accentDark: "#A78BFA",
    hero: ["#1a0a3d", "#2d1a5c", "#1a0a4a"],
    tipsBg: "#f5f3ff",
    tipsBgDark: "#0d0618",
    tipsColor: "#5b21b6",
    tipsColorDark: "#a78bfa",
    description: "Inteligență artificială, gadgeturi, aplicații, securitate digitală, explicații tech fără jargon.",
  },
  {
    slug: "calatorie",
    label: "Călătorie",
    accent: "#0891B2",
    accentDark: "#22D3EE",
    hero: ["#0a2028", "#0f3545", "#0a2535"],
    tipsBg: "#ecfeff",
    tipsBgDark: "#040e12",
    tipsColor: "#0e7490",
    tipsColorDark: "#22d3ee",
    description: "Destinații din România și din lume, ghiduri practice, sfaturi de vacanță și călătorie cu buget redus.",
  },
  {
    slug: "cultura",
    label: "Cultură & Arte",
    accent: "#9D174D",
    accentDark: "#FB7185",
    hero: ["#1f0a18", "#3d1228", "#2d0a1e"],
    tipsBg: "#fff1f2",
    tipsBgDark: "#0f0508",
    tipsColor: "#881337",
    tipsColorDark: "#fb7185",
    description: "Film, teatru, muzică, carte, expoziții, patrimoniu cultural românesc, interviuri cu artiști.",
  },
  {
    slug: "sport",
    label: "Sport",
    accent: "#EA580C",
    accentDark: "#FB923C",
    hero: ["#1a0a05", "#3d1a08", "#2d1205"],
    tipsBg: "#fff7ed",
    tipsBgDark: "#0f0803",
    tipsColor: "#c2410c",
    tipsColorDark: "#fb923c",
    description: "Fotbal, tenis, atletism, sporturi de iarnă — analize, povești din culise, sfaturi pentru sportivi amatori.",
  },
  {
    slug: "familie",
    label: "Familie & Parenting",
    accent: "#F59E0B",
    accentDark: "#FCD34D",
    hero: ["#1e1505", "#3d2a0a", "#2d1e08"],
    tipsBg: "#fffbeb",
    tipsBgDark: "#120d03",
    tipsColor: "#92400e",
    tipsColorDark: "#fcd34d",
    description: "Creșterea copiilor, relații de cuplu, echilibrul muncă-viață, psihologie aplicată în familie.",
  },
  {
    slug: "editorial",
    label: "Editorial",
    accent: "#64748B",
    accentDark: "#94A3B8",
    hero: ["#0f172a", "#1e293b", "#0f172a"],
    tipsBg: "#f8fafc",
    tipsBgDark: "#0f172a",
    tipsColor: "#475569",
    tipsColorDark: "#94a3b8",
    description: "Opinii, analize și perspective originale Prism News. Jurnalism de opinie bazat pe fapte verificate.",
  },
];

/** Map slug → categorie pentru lookup rapid. */
export const CATEGORY_MAP = Object.fromEntries(
  EDITORIAL_CATEGORIES.map((c) => [c.slug, c])
) as Record<string, EditorialCategory>;

/** Label afișat în UI (include label-ul părintelui dacă e subcategorie). */
export function getCategoryLabel(slug: string): string {
  const cat = CATEGORY_MAP[slug];
  if (!cat) return slug;
  if (cat.parent) {
    const parent = CATEGORY_MAP[cat.parent];
    return parent ? `${parent.label} · ${cat.label}` : cat.label;
  }
  return cat.label;
}

/** CSS variables inline pentru un articol — injectate ca data-category pe .editorial-wrapper. */
export function getCategoryCssVars(slug: string): string {
  const cat = CATEGORY_MAP[slug];
  if (!cat) return "";
  return [
    `--ed-accent: ${cat.accent}`,
    `--ed-accent-dark: ${cat.accentDark}`,
    `--ed-hero-from: ${cat.hero[0]}`,
    `--ed-hero-mid: ${cat.hero[1]}`,
    `--ed-hero-to: ${cat.hero[2]}`,
    `--ed-tips-bg: ${cat.tipsBg}`,
    `--ed-tips-bg-dark: ${cat.tipsBgDark}`,
    `--ed-tips-color: ${cat.tipsColor}`,
    `--ed-tips-color-dark: ${cat.tipsColorDark}`,
  ].join("; ");
}
