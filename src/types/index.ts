export type Bias = "left" | "center" | "right";

export interface Source {
  id: string;
  name: string;
  logo_url: string | null;
  bias: Bias;
  // Câmpuri de transparență (opționale — pot lipsi din DB dacă nu sunt completate)
  owner?: string | null;
  notable_interests?: string | null;
  factuality_score?: number | null;  // 0–100
  profile_url?: string | null;
}

export interface Article {
  id: string;
  source_id: string;
  title: string;
  summary: string | null;
  link: string;
  image_url: string | null;
  published_at: string; // ISO string
  bias: Bias;
  cluster_id: string | null;
  original_snippet: string | null;
  ai_pre_summary: string | null;
  ai_summary: string | null;
  source?: Source;
}

export interface ClusterRow {
  cluster_id: string;
  left: Article | null;
  center: Article | null;
  right: Article | null;
}
