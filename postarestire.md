# Ghid: Postare Articol Editorial Prism News

Acest document descrie pașii exacți pentru a publica un articol editorial original
pe Prisma News, pornind de la un fișier HTML furnizat de utilizator.

---

## Contextul sistemului editorial

Articolele editoriale Prism News sunt știri/articole originale (nu agregate din RSS).
Ele sunt stocate în tabela `articles` din Supabase, cu câmpul `content_html` completat.
Sunt afișate **primele în feed**, deasupra știrilor RSS, sub bannerul `✦ Prism News Original`.
Fiecare articol are o pagină dedicată la `/editorial/[id]`.

Infrastructura este deja instalată. Pentru un articol nou nu trebuie schimbat codul React —
doar HTML-ul din `public/stiri/[categorie]/` și rularea scriptului de inserție (stilurile editoriale sunt
în `src/app/editorial/[id]/page.tsx`, variabila `editorialStyles`).

---

## Condiții prealabile (o singură dată, deja făcut)

Verifică că există în DB înainte de primul articol:

```sql
-- Coloane (idempotent)
ALTER TABLE articles ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS content_html TEXT;

-- Sursa editorială specială
INSERT INTO sources (id, name, rss_url, bias, logo_url)
VALUES (
  '00000000-0000-0000-0001-000000000001',
  'Prism News Editorial',
  'https://prisma-news.ro/editorial',
  'center',
  null
)
ON CONFLICT (id) DO NOTHING;
```

Dacă aceste comenzi au fost deja rulate, nu trebuie rulate din nou.

---

## Pașii pentru un articol nou

### Pasul 1 — Pregătești HTML-ul articolului

**Șablon recomandat:** `public/template-editorial.html` — pornește de aici pentru articole noi:
conține toate secțiunile posibile (hero, teaser, science-card, tips, concluzie) cu clasele
suportate de site și comentarii `<!-- OPȚIONAL -->` unde poți șterge blocuri.

Poți folosi și `public/stiri/gospodarie/pasca-site.html` ca referință de articol complet (doar fragmentul
`<body>`, fără `<head>`/`<style>`/`<script>`).

După ce completezi textul, **salvează fișierul HTML în `public/stiri/[categorie]/`**
(ex: `public/stiri/cultura/nume-articol.html`). Subfolderul trebuie să corespundă slug-ului categoriei din DB
(`gospodarie`, `cultura`, `sanatate`, `economie`, `auto`, `tech`, `calatorie`, `sport`, `familie`, `editorial`, `retete` — aceasta din urmă e subcategoria rețete sub gospodărie).

Scriptul de inserție (`scripts/insert-editorial.mjs`) ia conținutul din interiorul `<body>`
dacă fișierul e document HTML complet; dacă fișierul e **doar fragment** (fără tag-uri
`<html>` / `<body>`, ca `public/stiri/gospodarie/pasca-site.html`), folosește tot textul ca `content_html`.
Elimină mereu blocurile `<script>`.

**Important:** Nu folosi clase Tailwind în HTML-ul stocat în DB — stilurile vin din
`editorialStyles` pe pagina `/editorial/[id]`. Folosește doar clasele documentate mai jos.

### Pasul 2 — Editează scriptul `scripts/insert-editorial.mjs`

Deschide fișierul și modifică **doar secțiunea marcată**:

```js
// ── Citim HTML-ul sursă ──────────────────────────────────────────────
const htmlPath = path.join(__dirname, "../public/stiri/[categorie]/NUME-FISIER.html");
//                                        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
//  Ex.: ../public/stiri/gospodarie/pasca-site.html (fragment) sau cultura/articol.html (cu <body>)

// ── Articol ──────────────────────────────────────────────────────────
const article = {
  source_id: EDITORIAL_SOURCE_ID,  // nu modifica
  title: "Titlul exact al articolului",
  summary: "2-3 propoziții care descriu articolul — apare în feed ca teaser",
  link: null,                       // nu modifica — scriptul îl setează automat
  image_url: "/stiri/pastele.jpg",   // opțional: fișier în public/stiri/ — thumbnail + copertă pe /editorial/[id]
  published_at: new Date().toISOString(),  // data publicării (acum)
  bias: "center",                   // nu modifica pentru editoriale
  cluster_id: null,                 // nu modifica
  ai_pre_summary: "O propoziție scurtă pentru cardul din feed (max 120 caractere)",
  ai_summary: null,
  subscription_topic: "cuvânt-cheie-topic",  // ex: "pasca", "sanatate", "auto"
  category: "gospodarie",           // vezi lista de categorii mai jos
  content_html: bodyHtml,           // nu modifica — extras automat din HTML
};
```

### Pasul 3 — Rulează scriptul

```bash
node scripts/insert-editorial.mjs
```

Pentru articole **deja în DB**, setează imaginile de copertă/thumbnail (ex. `public/stiri/pasca.png`, `public/stiri/pastele.jpg`) cu:

```bash
node scripts/set-editorial-images.mjs
```

Scriptul mapează `subscription_topic` (`pasca` → `/stiri/pasca.png`, `paste` → `/stiri/pastele.jpg`). Imaginile stau în `public/stiri/`.

Output așteptat:
```
✅ Articol inserat cu ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
✅ Link setat: /editorial/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

🔗 Accesibil la: https://prisma-news.ro/editorial/xxxxxxxx-...
```

Dacă apare eroare, verifică:
- `.env.local` are `NEXT_PUBLIC_SUPABASE_URL` și `SUPABASE_SERVICE_ROLE_KEY`
- Fișierul HTML există la calea setată în script (ex. `public/stiri/cultura/nume-articol.html`)
- Coloana `content_html` există în DB (rulează SQL-ul din Condiții prealabile)

### Pasul 4 — Verificare vizuală (opțional dar recomandat)

```bash
npm run dev
```

Verifică:
1. Homepage → articolul apare primul în feed cu badge auriu `✦ Prism News`
2. Click pe card → se deschide `/editorial/[id]` cu articolul complet
3. Dark mode → culorile se adaptează corect

---

## Categorii disponibile

| Slug | Etichetă afișată | Accent |
|---|---|---|
| `gospodarie` | Gospodărie | Auriu cald `#C8963E` |
| `retete` | Gospodărie · Rețete | Roșu-portocaliu `#DC4A1A` |
| `sanatate` | Sănătate | Verde smarald `#16A34A` |
| `economie` | Bani & Economie | Verde investiții `#4D7C0F` |
| `auto` | Auto | Albastru oțel `#1D4ED8` |
| `tech` | Tech & AI | Violet electric `#7C3AED` |
| `calatorie` | Călătorie | Turcoaz `#0891B2` |
| `cultura` | Cultură & Arte | Burgundy `#9D174D` |
| `sport` | Sport | Portocaliu `#EA580C` |
| `familie` | Familie & Parenting | Amber `#F59E0B` |
| `editorial` | Editorial | Slate `#64748B` |

**Documentație completă** (teme, ton, idei de articole per categorie): `categorii.md`
**Sursa de adevăr pentru cod** (culori, gradiente hero): `src/lib/editorial-categories.ts`

Pentru a adăuga o categorie nouă: adaugă un obiect în `EDITORIAL_CATEGORIES` din
`src/lib/editorial-categories.ts`. Celelalte fișiere importă automat de acolo.

---

## Cum funcționează stilizarea

HTML-ul primit este stocat ca-atare în câmpul `content_html` (fără `<head>`, `<style>`,
`<script>`). Pagina `/editorial/[id]/page.tsx` furnizează toate stilurile CSS prin
variabila `editorialStyles` (tag `<style>` inline).

**Clase HTML suportate** (definite în `editorialStyles` — folosesc variabilele site-ului
`--background`, `--foreground`, `--card`, `--muted`, `--accent`, fonturile `--font-playfair` /
`--font-geist-sans`, plus accent auriu local `--ed-gold` în `.editorial-wrapper`):

| Clasă HTML | Rol |
|------------|-----|
| `.hero` | Hero cu gradient brun (titlu/subtitlu lizibile pe fundal închis) |
| `.hero-badge` | Pilulă etichetă (caps) deasupra titlului |
| `.hero h1` | Titlu principal (Playfair); `<em>` = accent auriu |
| `.hero-subtitle` | Subtitlu italic sub titlu |
| `.ornament` | Separator decorativ (ex. `✦ ✦ ✦`) |
| `.article-container` | Container principal, lățime maximă, centrat |
| `.article-meta` | Rând meta: autor, timp citire, dată |
| `.meta-dot` | Punct separator între elemente meta |
| `.teaser-section` | Intro; primul `<p>` are literă mare (drop-cap) |
| `.read-more-wrapper` | **Ascuns** pe `/editorial/[id]` (păstrat pentru compatibilitate) |
| `.read-more-btn` | Buton în wrapper ascuns — nu se vede pe pagina editorială |
| `.expanded-content` | **Mereu vizibil** pe pagina editorială (fără restrângere) |
| `.section-heading` | Titlu de secțiune (H2) cu bară verticală accent |
| `.sub-heading` | Subtitlu secundar italic (H3 stilizat) |
| `.highlight-box` | Citat / observație în chenar cu border auriu |
| `.science-card` | Card explicație (etichetă `h4` + paragrafe; decor 🔬) |
| `.tips-section` | Bloc listă sfaturi cu titlu `h3` |
| `.tip-item` | Rând sfat: `.tip-number` + `.tip-text` |
| `.tip-number` | Cerc numerotat |
| `.tip-text` | Text sfat (poate conține `<strong>`) |
| `.conclusion-section` | Box concluzie (gradient brun, text deschis) |
| `.ed-conclusion-follow` | Paragraf concluzie cu spațiu deasupra |
| `.ed-conclusion-signoff` | Ultim paragraf (italic, accent auriu) |
| `.article-footer` | Footer mic (copyright / sursă) |

Dacă HTML-ul folosește alte clase, nu vor fi stilizate — mapează-le la tabel sau extinde
`editorialStyles` în `src/app/editorial/[id]/page.tsx`.

---

## Structură fișiere relevante

```
src/
  app/
    editorial/
      [id]/
        page.tsx          ← pagina articolului + CSS adaptat dark/light
  components/
    EditorialCard.tsx     ← cardul auriu din feed homepage
  lib/
    supabase.ts           ← fetchEditorialArticles() + fetchEditorialArticleById()
  types/
    index.ts              ← Article.category + Article.content_html

scripts/
  insert-editorial.mjs     ← scriptul de inserție (editează și rulează pentru fiecare articol)

public/
  template-editorial.html  ← șablon gol pentru articole editoriale noi (clasă + placeholder)
  stiri/
    [categorie]/           ← ex.: gospodarie, cultura, sanatate, economie, auto, tech,
                             calatorie, sport, familie, editorial, retete
    *.html                   ← articole HTML finalizate: public/stiri/[categorie]/nume-articol.html
```

---

## Regulă importantă

Nu modifica `src/components/DiscoveryFeed.tsx`, `src/components/SpectrumSection.tsx`
sau `src/components/NewsPageClient.tsx` pentru a publica un articol nou.
Articolele editoriale sunt complet separate de feed-ul RSS — sunt aduse din
`fetchEditorialArticles()` direct în `page.tsx` și randate prin `EditorialCard`.
