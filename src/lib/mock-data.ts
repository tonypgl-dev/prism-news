import type { Article } from "@/types";
export type { ClusterRow } from "@/types";
export { buildClusterRows } from "./cluster";

const now = new Date();
const hoursAgo = (h: number) =>
  new Date(now.getTime() - h * 3_600_000).toISOString();

export const MOCK_ARTICLES: Article[] = [
  // Cluster 1 – Bugetul de stat
  {
    id: "a1",
    source_id: "s1",
    title: "Guvernul taie cheltuielile sociale pentru a acoperi deficitul bugetar record",
    summary:
      "Ministerul Finanțelor a anunțat reduceri semnificative la pensii și ajutoare sociale, invocând presiunea crescută a datoriei publice. Sindicatele au reacționat imediat, anunțând proteste naționale pentru săptămâna viitoare.",
    link: "https://sursa-stanga.ro/buget-taieri",
    image_url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&q=80",
    published_at: hoursAgo(2),
    bias: "left",
    cluster_id: "c1",
    original_snippet: null, ai_pre_summary: null, ai_summary: null,
    source: { id: "s1", name: "Libertatea", logo_url: null, bias: "left", owner: "Ringier Romania", notable_interests: "Print, Digital, Entertainment", factuality_score: 78, profile_url: "https://mediabiasfactcheck.com/libertatea/" },
  },
  {
    id: "a2",
    source_id: "s2",
    title: "România adoptă pachet de austeritate pentru a respecta țintele europene",
    summary:
      "Executivul a aprobat un set de măsuri fiscale menit să aducă deficitul sub 3% din PIB până la finalul anului, conform angajamentelor față de Comisia Europeană.",
    link: "https://sursa-centru.ro/buget-austeritate",
    image_url: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80",
    published_at: hoursAgo(3),
    bias: "center",
    cluster_id: "c1",
    original_snippet: null, ai_pre_summary: null, ai_summary: null,
    source: { id: "s2", name: "Digi24", logo_url: null, bias: "center", owner: "RCS & RDS (Digi Communications)", notable_interests: "Telecomunicații, Cablu TV, Internet", factuality_score: 82, profile_url: "https://mediabiasfactcheck.com/digi24/" },
  },
  {
    id: "a3",
    source_id: "s3",
    title: "Disciplina bugetară salvează economia: cum PSD a ratat ani de-a rândul țintele fiscale",
    summary:
      "Actualul guvern a moștenit o gaură bugetară de proporții istorice. Măsurile de austeritate sunt unica soluție pentru redresarea credibilității externe a României.",
    link: "https://sursa-dreapta.ro/buget-disciplina",
    image_url: "https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?w=800&q=80",
    published_at: hoursAgo(1),
    bias: "right",
    cluster_id: "c1",
    original_snippet: null, ai_pre_summary: null, ai_summary: null,
    source: { id: "s3", name: "G4Media", logo_url: null, bias: "right", owner: "Asociația pentru Jurnalism Independent", notable_interests: "Justiție, Anticorupție, UE", factuality_score: 88, profile_url: "https://mediabiasfactcheck.com/g4media/" },
  },

  // Cluster 2 – Energie (fără perspectivă centru)
  {
    id: "a4",
    source_id: "s1",
    title: "Prețul energiei explodează: familiile vulnerabile nu-și permit facturile de iarnă",
    summary:
      "ONG-urile de mediu cer plafonarea imediată a tarifelor la energie electrică și gaze pentru consumatorii casnici. Sărăcia energetică afectează peste 30% din populație.",
    link: "https://sursa-stanga.ro/energie-pret",
    image_url: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&q=80",
    published_at: hoursAgo(5),
    bias: "left",
    cluster_id: "c2",
    original_snippet: null, ai_pre_summary: null, ai_summary: null,
    source: { id: "s1", name: "Libertatea", logo_url: null, bias: "left", owner: "Ringier Romania", notable_interests: "Print, Digital, Entertainment", factuality_score: 78, profile_url: "https://mediabiasfactcheck.com/libertatea/" },
  },
  {
    id: "a5",
    source_id: "s3",
    title: "Investițiile în energie verde vor reduce facturile pe termen lung, susțin experții",
    summary:
      "Tranziția energetică prin surse regenerabile este singura cale de a scăpa de dependența față de gazele rusești și de a stabiliza prețurile pe piața liberă.",
    link: "https://sursa-dreapta.ro/energie-verde",
    image_url: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=800&q=80",
    published_at: hoursAgo(4),
    bias: "right",
    cluster_id: "c2",
    original_snippet: null, ai_pre_summary: null, ai_summary: null,
    source: { id: "s3", name: "G4Media", logo_url: null, bias: "right", owner: "Asociația pentru Jurnalism Independent", notable_interests: "Justiție, Anticorupție, UE", factuality_score: 88, profile_url: "https://mediabiasfactcheck.com/g4media/" },
  },

  // Cluster 3 – Alegeri locale
  {
    id: "a6",
    source_id: "s2",
    title: "Sondaj: PSD și PNL la egalitate în marile orașe înaintea alegerilor locale",
    summary:
      "Un nou sondaj realizat de CURS arată că diferența dintre cele două partide este sub marja de eroare în București, Cluj și Timișoara, cu 3 luni înainte de scrutin.",
    link: "https://sursa-centru.ro/alegeri-sondaj",
    image_url: "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=800&q=80",
    published_at: hoursAgo(6),
    bias: "center",
    cluster_id: "c3",
    original_snippet: null, ai_pre_summary: null, ai_summary: null,
    source: { id: "s2", name: "Digi24", logo_url: null, bias: "center", owner: "RCS & RDS (Digi Communications)", notable_interests: "Telecomunicații, Cablu TV, Internet", factuality_score: 82, profile_url: "https://mediabiasfactcheck.com/digi24/" },
  },
  {
    id: "a7",
    source_id: "s3",
    title: "Candidații independenți câștigă teren în fața partidelor tradiționale",
    summary:
      "Valul anti-establishment crește în sondaje. Candidații fără afiliere de partid înregistrează scoruri record în mai multe județe, semn al crizei de reprezentativitate.",
    link: "https://sursa-dreapta.ro/alegeri-independenti",
    image_url: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&q=80",
    published_at: hoursAgo(7),
    bias: "right",
    cluster_id: "c3",
    original_snippet: null, ai_pre_summary: null, ai_summary: null,
    source: { id: "s3", name: "G4Media", logo_url: null, bias: "right", owner: "Asociația pentru Jurnalism Independent", notable_interests: "Justiție, Anticorupție, UE", factuality_score: 88, profile_url: "https://mediabiasfactcheck.com/g4media/" },
  },

  // Cluster 4 – complet
  {
    id: "a8",
    source_id: "s1",
    title: "Criza locuințelor: chiriile din București au crescut cu 40% în doi ani",
    summary:
      "Tinerii sub 35 de ani alocă peste 60% din venit pentru chirie în capitală. Asociațiile de proprietari cer statu-quo, în timp ce sindicatele presează pentru un plafon legal.",
    link: "https://sursa-stanga.ro/chirii-criza",
    image_url: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80",
    published_at: hoursAgo(10),
    bias: "left",
    cluster_id: "c4",
    original_snippet: null, ai_pre_summary: null, ai_summary: null,
    source: { id: "s1", name: "Libertatea", logo_url: null, bias: "left", owner: "Ringier Romania", notable_interests: "Print, Digital, Entertainment", factuality_score: 78, profile_url: "https://mediabiasfactcheck.com/libertatea/" },
  },
  {
    id: "a9",
    source_id: "s2",
    title: "Piața imobiliară: cererea depășește oferta în marile centre urbane",
    summary:
      "Raportul BNR arată că numărul locuințelor noi livrate este cu 25% sub necesarul pieței. Dobânzile ridicate au înghețat creditele ipotecare pentru clasa de mijloc.",
    link: "https://sursa-centru.ro/piata-imobiliara",
    image_url: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800&q=80",
    published_at: hoursAgo(11),
    bias: "center",
    cluster_id: "c4",
    original_snippet: null, ai_pre_summary: null, ai_summary: null,
    source: { id: "s2", name: "Digi24", logo_url: null, bias: "center", owner: "RCS & RDS (Digi Communications)", notable_interests: "Telecomunicații, Cablu TV, Internet", factuality_score: 82, profile_url: "https://mediabiasfactcheck.com/digi24/" },
  },
  {
    id: "a10",
    source_id: "s3",
    title: "Birocrația și taxele ridicate frânează construcțiile de locuințe noi",
    summary:
      "Developerii imobiliari avertizează că autorizațiile de construire durează în medie 18 luni în România față de 3 luni în Polonia. Reformele administrative sunt urgente.",
    link: "https://sursa-dreapta.ro/constructii-birocratie",
    image_url: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=80",
    published_at: hoursAgo(12),
    bias: "right",
    cluster_id: "c4",
    original_snippet: null, ai_pre_summary: null, ai_summary: null,
    source: { id: "s3", name: "G4Media", logo_url: null, bias: "right", owner: "Asociația pentru Jurnalism Independent", notable_interests: "Justiție, Anticorupție, UE", factuality_score: 88, profile_url: "https://mediabiasfactcheck.com/g4media/" },
  },
];


export const BREAKING_NEWS = [
  "BREAKING: Premierul convoacă ședință de urgență pe tema inflației",
  "UPDATE: Curtea Constituțională amână decizia privind legea pensiilor",
  "EXCLUSIV: România negociază un nou acord cu FMI pentru stabilizare fiscală",
  "ALERTĂ: Furtună puternică în vestul țării — cod roșu în 5 județe",
];
