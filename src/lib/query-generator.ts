import { ask, extractJSON } from "./claude";
import { BRAND_CONTEXT } from "./brand";
import type { Platform } from "./types";

export interface GeneratedQueries {
  reddit: string[];
  tiktok: string[];
  youtube: string[];
  trustpilot: string[];
}

/**
 * Generate platform-specific, audience-aware queries from brand context
 * OR from a specific hypothesis/intent.
 */
export async function generateQueries(opts: {
  intent?: string;
  hypothesis?: string;
  avatarName?: string;
  count?: number;
}): Promise<GeneratedQueries> {
  const count = opts.count ?? 6;

  const focus = opts.hypothesis
    ? `Focus all queries on testing this hypothesis (find both supporting AND refuting evidence):\n${opts.hypothesis}`
    : opts.avatarName
    ? `Focus queries on discovering the voice of: ${opts.avatarName}`
    : opts.intent
    ? `Focus on: ${opts.intent}`
    : "Find deep consumer voice — pain points, desires, frustrations, testimonials, competitor complaints — related to creatine, gut health, vegan nutrition, brain performance, aging vitality.";

  const raw = await ask({
    tier: "fast",
    maxTokens: 2000,
    temperature: 0.5,
    system: `You are a research strategist for frelo. Generate platform-specific search queries that maximize signal-to-noise. Different platforms need different query styles:
- Reddit: conversational, problem-framed ("why does creatine make me bloated", "vegan protein alternatives")
- TikTok: short hashtag-like phrases, trendy language ("creatine gummies review", "menopause supplements")
- YouTube: instructional ("creatine side effects women", "best creatine 2025")
- Trustpilot: brand domains for review mining (e.g., "trycreate.co", "optimumnutrition.com")

Return ONLY valid JSON:
{
  "reddit": ["query 1", "query 2", ...],
  "tiktok": ["query 1", ...],
  "youtube": ["query 1", ...],
  "trustpilot": ["competitor1.com", "competitor2.com"]
}

Generate ${count} queries per platform (except trustpilot — 3-5 competitor domains).
${BRAND_CONTEXT}`,
    user: focus,
  });

  const parsed = extractJSON<GeneratedQueries>(raw);
  return {
    reddit: parsed.reddit ?? [],
    tiktok: parsed.tiktok ?? [],
    youtube: parsed.youtube ?? [],
    trustpilot: parsed.trustpilot ?? [],
  };
}

export function flattenQueries(gq: GeneratedQueries): Array<{ platform: Platform; query: string }> {
  return [
    ...gq.reddit.map((q) => ({ platform: "reddit" as Platform, query: q })),
    ...gq.tiktok.map((q) => ({ platform: "tiktok" as Platform, query: q })),
    ...gq.youtube.map((q) => ({ platform: "youtube" as Platform, query: q })),
    ...gq.trustpilot.map((q) => ({ platform: "trustpilot" as Platform, query: q })),
  ];
}
