// ----------------------------------------------------------------
// Categorii feed & detecție din titlu
// ----------------------------------------------------------------

export type RegionKey =
  | "moldova"
  | "transilvania"
  | "muntenia"
  | "oltenia"
  | "banat"
  | "dobrogea"
  | "maramures";

export type CategoryKey =
  | "politica"
  | "justitie"
  | "economie"
  | "extern"
  | "social"
  | "sport"
  | "monden"
  | "tech"
  | "regional"
  | "altele";

export interface Category {
  key: CategoryKey;
  label: string;
  emoji: string;
}

export interface Region {
  key: RegionKey;
  label: string;
  keywords: string[];
}

export const CATEGORIES: Category[] = [
  { key: "politica",  label: "Politică",            emoji: "🏛️" },
  { key: "justitie",  label: "Justiție & DNA",       emoji: "⚖️" },
  { key: "economie",  label: "Economie",             emoji: "📈" },
  { key: "extern",    label: "Extern & Geopolitică", emoji: "🌍" },
  { key: "social",    label: "Social",               emoji: "👥" },
  { key: "sport",     label: "Sport",                emoji: "⚽" },
  { key: "monden",    label: "Monden",               emoji: "🎬" },
  { key: "tech",      label: "Tech & Știință",       emoji: "💻" },
  { key: "regional",  label: "Regional",             emoji: "📍" },
  { key: "altele",    label: "Altele",               emoji: "📄" },
];

export const REGIONS: Region[] = [
  {
    key: "moldova",
    label: "Moldova",
    keywords: [
      "iași", "iasi", "bacău", "bacau", "suceava", "vaslui",
      "neamț", "neamt", "galați", "galati", "vrancea", "botoșani", "botosani",
      "roman", "focșani", "focsani", "piatra neamț",
    ],
  },
  {
    key: "transilvania",
    label: "Transilvania",
    keywords: [
      "cluj", "brașov", "brasov", "sibiu", "mureș", "mures",
      "alba iulia", "alba", "bistrița", "bistrita", "harghita",
      "covasna", "sfântu gheorghe", "sfantu gheorghe", "miercurea ciuc",
      "târgu mureș", "targu mures", "sighișoara", "sighisoara",
    ],
  },
  {
    key: "muntenia",
    label: "Muntenia & București",
    keywords: [
      "bucurești", "bucuresti", "ploiești", "ploiesti", "târgoviște", "targoviste",
      "pitești", "pitesti", "alexandria", "giurgiu", "călărași", "calarasi",
      "buzău", "buzau", "prahova", "dâmbovița", "dambovita", "ilfov",
    ],
  },
  {
    key: "oltenia",
    label: "Oltenia",
    keywords: [
      "craiova", "râmnicu vâlcea", "ramnicu valcea", "rm. vâlcea",
      "drobeta", "turnu severin", "slatina", "târgu jiu", "targu jiu",
      "dolj", "vâlcea", "valcea", "gorj", "olt", "mehedinți", "mehedinti",
    ],
  },
  {
    key: "banat",
    label: "Banat & Vest",
    keywords: [
      "timișoara", "timisoara", "arad", "reșița", "resita",
      "deva", "hunedoara", "caransebeș", "caransebesi", "lugoj",
      "timiș", "timis",
    ],
  },
  {
    key: "dobrogea",
    label: "Dobrogea",
    keywords: [
      "constanța", "constanta", "tulcea", "mangalia", "medgidia",
      "cernavodă", "cernavoda", "litoral", "marea neagră",
    ],
  },
  {
    key: "maramures",
    label: "Maramureș & Nord-Vest",
    keywords: [
      "oradea", "satu mare", "baia mare", "zalău", "zalau",
      "bihor", "sălaj", "salaj", "maramureș", "maramures",
      "sighetul marmației", "sighetul marmatiei",
    ],
  },
];

// ----------------------------------------------------------------
// Cuvinte cheie per categorie (normalizate fără diacritice)
// ----------------------------------------------------------------

const KEYWORDS: Record<CategoryKey, string[]> = {
  politica: [
    "guvern", "minister", "ministru", "parlament", "partid", "premier", "presedinte",
    "presedintele", "vot", "votul", "lege", "legea", "psd", "pnl", "usr", "aur", "udmr",
    "senat", "senatorul", "deputat", "deputatul", "coalitie", "opozitie", "alegeri",
    "electorala", "electoral", "cabinet", "executiv", "legislativ", "ciolacu",
    "iohannis", "geoana", "citu", "orban", "referendum", "motiune", "demisie",
    "premier", "vicepremier", "prim-ministru", "guvernare",
  ],
  justitie: [
    "dna", "diicot", "dosar", "arest", "arestat", "retinuta", "retinut", "judecatorie",
    "tribunal", "condamnat", "condamnata", "procuror", "rechizitoriu", "achitat",
    "perchezitie", "urmarire penala", "inculpat", "inculpata", "sentinta",
    "apel", "recurs", "instanta", "judecator", "anabi", "ccr", "csm",
    "iccj", "anticoruptie", "coruptie", "dare de mita", "luare de mita",
    "evaziune", "frauda", "delapidare", "abuz",
  ],
  economie: [
    "inflatie", "salariu", "salarii", "pensie", "pensii", "buget", "taxa", "impozit",
    "bnr", "curs", "pib", "investitie", "bursa", "actiuni", "economie", "economic",
    "deficit", "datorie", "datoria", "finante", "fiscal", "fiscala", "banca",
    "credit", "dobanda", "euro", "dolar", "leu", "scumpire", "ieftinire",
    "pretul", "preturile", "energie", "gaz", "curent electric", "factura",
    "somaj", "angajare", "concediere", "firma", "companie", "profit",
    "pierdere", "faliment", "insolventa", "subventie", "fond european",
  ],
  extern: [
    "ucraina", "rusia", "nato", "ue", "trump", "gaza", "razboi", "summit",
    "zelenski", "putin", "biden", "bruxelles", "washington", "moscova",
    "kiev", "israel", "iran", "china", "sua", "europa", "geopolitic",
    "geopolitica", "diplomatic", "ambasador", "sanctiuni", "conflict",
    "armata", "militar", "trupe", "soldati", "atacuri", "bomba",
    "explozii", "onu", "g7", "g20", "fmi", "banca mondiala",
  ],
  social: [
    "spital", "sanatate", "scoala", "educatie", "protest", "greva",
    "accident", "incendiu", "victima", "victime", "sinistrat",
    "inundatie", "cutremur", "dezastru", "refugiati", "imigranti",
    "pensionari", "studenti", "elevi", "profesori", "medici",
    "asistenti", "ambulanta", "urgenta", "urs", "vreme", "ninsoare",
    "cod rosu", "cod portocaliu", "calamitate", "fenomene",
  ],
  sport: [
    "fotbal", "fcsb", "dinamo", "rapid", "steaua", "cfr cluj",
    "meci", "gol", "campionat", "transfer", "fifa", "uefa", "tenis",
    "simona halep", "hagi", "mutu", "liga 1", "premier league",
    "champions league", "euro", "mondial", "olimpiada", "atletism",
    "handbal", "baschet", "volei", "rugby", "box", "mma", "curse",
    "formula 1", "ciclism", "inot", "gimnastica",
  ],
  monden: [
    "vedeta", "vedete", "divort", "scandal", "serial", "film",
    "muzica", "concert", "miss", "frumusete", "fashion", "moda",
    "showbiz", "paparazzi", "celebrity", "cantaret", "cantareata",
    "actor", "actrita", "manele", "petrecere", "nunta", "botez",
    "instagram", "tiktok", "influencer", "vlog", "youtube",
  ],
  tech: [
    "ai", "inteligenta artificiala", "aplicatie", "telefon", "smartphone",
    "cercetare", "descoperire", "spatiu", "robot", "tehnologie",
    "silicon valley", "apple", "google", "microsoft", "meta",
    "openai", "chatgpt", "cybersecurity", "hacker", "date personale",
    "digitalizare", "startup", "inovatie", "electric", "masina electrica",
  ],
  regional: [],
  altele: [],
};

// ----------------------------------------------------------------
// Normalizare text (scoate diacritice, lowercase)
// ----------------------------------------------------------------

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[șş]/g, "s")
    .replace(/[țţ]/g, "t")
    .replace(/[ăâ]/g, "a")
    .replace(/î/g, "i");
}

// ----------------------------------------------------------------
// detectCategory — returnează categoria principală + regiunea dacă e cazul
// ----------------------------------------------------------------

export function detectCategory(title: string): CategoryKey {
  const t = normalize(title);

  // Ordinea contează — categorii mai specifice primul
  const order: CategoryKey[] = [
    "justitie", "sport", "monden", "tech",
    "extern", "economie", "politica", "social", "regional",
  ];

  for (const key of order) {
    if (key === "regional") continue; // tratat separat
    if (KEYWORDS[key].some((kw) => t.includes(kw))) return key;
  }

  // Regional — verificăm toate județele/orașele
  const allRegionKeywords = REGIONS.flatMap((r) => r.keywords);
  if (allRegionKeywords.some((kw) => t.includes(normalize(kw)))) return "regional";

  return "altele";
}

export function detectRegion(title: string): RegionKey | null {
  const t = normalize(title);
  for (const region of REGIONS) {
    if (region.keywords.some((kw) => t.includes(normalize(kw)))) {
      return region.key;
    }
  }
  return null;
}

// ----------------------------------------------------------------
// Toate categoriile active by default
// ----------------------------------------------------------------

export const ALL_CATEGORY_KEYS = CATEGORIES.map((c) => c.key);
export const ALL_REGION_KEYS = REGIONS.map((r) => r.key);
