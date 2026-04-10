export type Platform =
  | "reddit"
  | "tiktok"
  | "youtube"
  | "amazon"
  | "trustpilot"
  | "x"
  | "quora"
  | "podcast"
  | "pubmed"
  | "first_party";

export type Sentiment = "positive" | "negative" | "neutral" | "mixed";

export type ItemCategory =
  | "pain_point"
  | "desire"
  | "frustration"
  | "breakthrough"
  | "objection"
  | "testimonial"
  | "competitor_complaint";

export interface IntelItem {
  id: number;
  source_id: number;
  platform: Platform;
  external_id: string | null;
  content: string;
  author: string | null;
  url: string | null;
  source_title: string | null;
  posted_at: string | null;
  engagement: number;
  sentiment: Sentiment | null;
  category: ItemCategory | null;
  sub_theme: string | null;
  belief_map: string | null;
  emotional_intensity: number | null;
  frelo_relevance: number | null;
  key_phrases: string[];
  marketing_angle: string | null;
  analyzed_at: string | null;
}

export interface IntelAvatar {
  id: number;
  name: string;
  age_range: string | null;
  profile: string | null;
  pain_points: string[];
  desires: string[];
  language_patterns: string[];
  hooks: Array<{ text: string; type: string; follow_up?: string; why?: string }>;
  confidence_score: number | null;
  momentum_score: number | null;
  citation_count: number;
  source_item_ids: number[];
}

export interface IntelHypothesis {
  id: number;
  statement: string;
  status: "open" | "testing" | "validated" | "refuted" | "inconclusive";
  confidence_score: number | null;
  verdict: string | null;
  sub_claims: string[];
  supporting_item_ids: number[];
  refuting_item_ids: number[];
}

export interface IntelAlert {
  id: number;
  kind: "new_theme" | "competitor_complaint" | "momentum_spike" | "narrative_shift" | "avatar_discovered";
  severity: "info" | "warning" | "critical";
  title: string;
  body: string | null;
  seen: boolean;
  created_at: string;
}
