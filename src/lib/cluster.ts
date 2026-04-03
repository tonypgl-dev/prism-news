/**
 * cluster.ts – Port TypeScript al logicii de clustering din cluster.js (backend).
 * Folosit în frontend pentru a grupa articolele din mock-data sau din Supabase
 * când cluster_id nu este pre-calculat.
 */

import type { Article, ClusterRow } from "@/types";

export const SIMILARITY_THRESHOLD = 0.7;
export const WINDOW_HOURS = 12;

// ----------------------------------------------------------------
// Stopwords RO
// ----------------------------------------------------------------
/**
 * Stopwords stocate FĂRĂ diacritice, deoarece tokenize() aplică normalize('NFD')
 * și elimină diacriticele ÎNAINTE de a verifica lista.
 * Conține:
 *  - Cuvinte gramaticale românești (articole, pronume, prepoziții, conjuncții)
 *  - Termeni specifici presei care poluează scorul de similitudine
 */
const RO_STOPWORDS = new Set([
  // ── Articole, pronume, prepoziții, conjuncții ──────────────────
  "a", "ai", "ale", "al", "am", "ar", "are", "au",
  "ca", "ci", "cu", "cum",
  "da", "dar", "de", "deci", "din", "dupa",
  "e", "ei", "el", "ele", "era", "este", "eu",
  "fata", "fi", "fie",
  "ii", "il", "imi", "in", "inainte", "intre", "iti",
  "la", "le", "li", "lor", "lui",
  "mai", "ma", "mi", "mult",
  "ne", "noi", "nu",
  "o", "or", "ori",
  "pe", "pentru", "prin",
  "sa", "se", "si", "sub", "sunt",
  "te", "tot", "tu",
  "un", "una", "unde", "unei", "unii", "unor", "unuia", "unui",
  "va", "vom",
  "cel", "cea", "cei", "cele",
  "acest", "aceasta", "acesti", "aceste", "acel", "acela", "ace", "intreg",
  "care", "cand", "cat", "cati", "cate", "cata",
  "daca", "desi", "decat", "doar",
  "iar", "inca", "insa",
  "ori", "orice", "oricand", "oricine",
  "pana", "poate", "prea",
  "fara", "astfel", "atunci", "acum", "azi", "ieri", "maine",
  "chiar", "deja", "dintre", "despre", "dintr",

  // ── Termeni specifici presei ────────────────────────────────────
  // Format/media
  "video", "foto", "fotografie", "fotografii", "galerie", "live",
  "breaking", "news", "update", "exclusiv",
  "stire", "stiri", "articol", "articole",

  // Atribuire și surse
  "surse", "sursa", "oficial", "oficiale", "oficiali",
  "declaratie", "declaratii", "anunt", "anuntul", "anuntat",
  "afirmat", "declarat", "transmis", "comunicat", "precizat",
  "potrivit", "conform", "informatii",

  // Timp/frecvente în titluri
  "ora", "ore", "ziua", "saptamana", "luna", "an", "ani", "luni",
  "minut", "minute", "astazi", "seara", "dimineata",

  // Intensificatori și clișee jurnalistice
  "mare", "mic", "nou", "noi", "vechi", "primul", "prima",
  "important", "importanta", "importanti", "importante",
  "record", "alerta", "atentie", "urgent", "urgenta",
  "situatie", "caz", "cazul", "problema", "criza",
]);

// ----------------------------------------------------------------
// Normalizare
// ----------------------------------------------------------------

export function tokenize(title: string): string[] {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !RO_STOPWORDS.has(w));
}

// ----------------------------------------------------------------
// Dice coefficient pe bigramele de caractere
// ----------------------------------------------------------------

function getBigrams(str: string): Set<string> {
  const bigrams = new Set<string>();
  for (let i = 0; i < str.length - 1; i++) {
    bigrams.add(str.slice(i, i + 2));
  }
  return bigrams;
}

export function diceSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;

  const bigramsA = getBigrams(a);
  const bigramsB = getBigrams(b);
  let intersection = 0;
  for (const bg of bigramsA) {
    if (bigramsB.has(bg)) intersection++;
  }
  return (2 * intersection) / (bigramsA.size + bigramsB.size);
}

/**
 * Scor compozit: Dice 60% + Jaccard pe token-uri 40%.
 *
 * Normalizarea NFD este aplicată de tokenize(), deci ambele șiruri sunt
 * garantat fără diacritice la momentul comparării — 'pensionari' (cu ș)
 * și 'pensionari' (cu s) produc același token 'pensionari'.
 */
export function titleSimilarity(titleA: string, titleB: string): number {
  const normA = tokenize(titleA).join(" ");
  const normB = tokenize(titleB).join(" ");
  if (!normA || !normB) return 0;

  const diceScore = diceSimilarity(normA, normB);

  const setA = new Set(normA.split(" "));
  const setB = new Set(normB.split(" "));
  const union = new Set([...setA, ...setB]);
  let inter = 0;
  for (const t of setA) {
    if (setB.has(t)) inter++;
  }
  const jaccardScore = union.size > 0 ? inter / union.size : 0;

  return diceScore * 0.6 + jaccardScore * 0.4;
}

// ----------------------------------------------------------------
// Clustering client-side (pentru articole fără cluster_id pre-calculat)
// ----------------------------------------------------------------

type ArticleRef = { id: string; title: string; cluster_id: string | null };

/**
 * Atribuie cluster_id-uri pe un array de articole în memorie,
 * folosind aceeași logică ca backend-ul.
 * Returnează o nouă copie a articolelor cu cluster_id completat.
 */
export function clusterInMemory(articles: Article[]): Article[] {
  const index: ArticleRef[] = [];
  const result: Article[] = [];

  for (const article of articles) {
    // Dacă are deja cluster_id setat (din DB), îl păstrăm
    if (article.cluster_id) {
      index.push({ id: article.id, title: article.title, cluster_id: article.cluster_id });
      result.push(article);
      continue;
    }

    // Verificăm doar articole din ultimele WINDOW_HOURS
    const cutoff = Date.now() - WINDOW_HOURS * 3_600_000;
    const inWindow = new Date(article.published_at).getTime() >= cutoff;

    let bestId: string | null = null;
    let bestScore = 0;

    if (inWindow) {
      for (const ref of index) {
        if (!ref.cluster_id) continue;
        const score = titleSimilarity(article.title, ref.title);
        if (score >= SIMILARITY_THRESHOLD && score > bestScore) {
          bestScore = score;
          bestId = ref.cluster_id;
        }
      }
    }

    const assignedId = bestId ?? crypto.randomUUID();
    const updated = { ...article, cluster_id: assignedId };
    index.push({ id: article.id, title: article.title, cluster_id: assignedId });
    result.push(updated);
  }

  return result;
}

// ----------------------------------------------------------------
// buildClusterRows – groupare pe rânduri pentru AlignedGrid
// ----------------------------------------------------------------

/**
 * Grupează articolele în rânduri de câte 3 coloane (left/center/right)
 * aliniate după cluster_id. Articolele sunt sortate după published_at DESC.
 */
export function buildClusterRows(rawArticles: Article[]): ClusterRow[] {
  // Sortare: cele mai recente primele
  const articles = [...rawArticles].sort(
    (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  );

  // Asigurăm cluster_id pentru fiecare articol
  const clustered = clusterInMemory(articles);

  const map = new Map<string, ClusterRow>();

  for (const article of clustered) {
    const key = article.cluster_id!;
    if (!map.has(key)) {
      map.set(key, { cluster_id: key, left: null, center: null, right: null });
    }
    const row = map.get(key)!;
    // Primul articol din fiecare bias câștigă slotul
    if (article.bias === "left" && !row.left) row.left = article;
    if (article.bias === "center" && !row.center) row.center = article;
    if (article.bias === "right" && !row.right) row.right = article;
  }

  // Sortăm rândurile după cel mai recent articol din fiecare cluster
  return Array.from(map.values()).sort((rowA, rowB) => {
    const latestA = Math.max(
      ...[rowA.left, rowA.center, rowA.right]
        .filter(Boolean)
        .map((a) => new Date(a!.published_at).getTime())
    );
    const latestB = Math.max(
      ...[rowB.left, rowB.center, rowB.right]
        .filter(Boolean)
        .map((a) => new Date(a!.published_at).getTime())
    );
    return latestB - latestA;
  });
}
