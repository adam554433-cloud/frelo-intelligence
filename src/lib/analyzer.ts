import { supabaseAdmin } from "./supabase";
import { ask, extractJSON } from "./claude";
import { BRAND_CONTEXT } from "./brand";

interface RawItem {
  id: number;
  content: string;
  platform: string;
}

interface AnalyzedItem {
  id: number;
  sentiment: "positive" | "negative" | "neutral" | "mixed";
  category: string;
  sub_theme: string;
  belief_map: string;
  emotional_intensity: number;
  frelo_relevance: number;
  marketing_angle: string;
  key_phrases: string[];
}

const BATCH_SIZE = 10;

/**
 * Batched frelo-aware analyzer. Sends 10 items per Claude call.
 * Every item gets a frelo_relevance score 0-10 that filters signal from noise.
 */
export async function analyzeBatch(items: RawItem[]): Promise<AnalyzedItem[]> {
  if (items.length === 0) return [];

  const formatted = items
    .map((it, i) => `### Item ${i + 1} (id=${it.id}, platform=${it.platform})\n${it.content.slice(0, 1500)}`)
    .join("\n\n");

  const raw = await ask({
    tier: "fast",
    maxTokens: 4000,
    temperature: 0.2,
    system: `You are a marketing intelligence analyst for frelo. Analyze each item and return ONE JSON array entry per item.

For each item, extract:
- sentiment: positive | negative | neutral | mixed
- category: pain_point | desire | frustration | breakthrough | objection | testimonial | competitor_complaint
- sub_theme: specific topic in 3-5 words
- belief_map: the underlying belief or assumption
- emotional_intensity: 1-10
- frelo_relevance: 0-10 — how strongly does this item's pain/desire map to a frelo benefit (muscle, brain, recovery, gut, absorption, vegan, aging, convenience, ritual, taste)? 0 = irrelevant noise, 10 = perfect fit
- marketing_angle: 1-2 sentences on how to use this in an ad
- key_phrases: array of 2-3 EXACT quotes (verbatim from content)

Return ONLY valid JSON:
{"items": [{"id": 123, "sentiment": "...", "category": "...", "sub_theme": "...", "belief_map": "...", "emotional_intensity": 7, "frelo_relevance": 8, "marketing_angle": "...", "key_phrases": ["...", "..."]}]}

Use the id field from the item header, not the array index.
${BRAND_CONTEXT}`,
    user: formatted,
  });

  const parsed = extractJSON<{ items: AnalyzedItem[] }>(raw);
  return parsed.items ?? [];
}

export async function runAnalyzer(opts: { limit?: number; minRelevance?: number } = {}): Promise<{
  analyzed: number;
  kept: number;
}> {
  const db = supabaseAdmin();
  const limit = opts.limit ?? 100;

  const { data: items, error } = await db
    .from("intel_items")
    .select("id, content, platform")
    .is("analyzed_at", null)
    .limit(limit);

  if (error) throw new Error(`Fetch unanalyzed items: ${error.message}`);
  if (!items || items.length === 0) return { analyzed: 0, kept: 0 };

  let analyzed = 0;
  let kept = 0;

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    try {
      const results = await analyzeBatch(batch);

      for (const r of results) {
        const updateData = {
          sentiment: r.sentiment,
          category: r.category,
          sub_theme: r.sub_theme,
          belief_map: r.belief_map,
          emotional_intensity: r.emotional_intensity,
          frelo_relevance: r.frelo_relevance,
          marketing_angle: r.marketing_angle,
          key_phrases: r.key_phrases,
          analyzed_at: new Date().toISOString(),
        };
        await db.from("intel_items").update(updateData).eq("id", r.id);
        analyzed++;
        if (r.frelo_relevance >= 5) kept++;
      }
    } catch (err) {
      console.error(`Analyzer batch error:`, err);
    }
  }

  await db.from("intel_events").insert({
    kind: "analysis_finished",
    payload: { analyzed, kept },
  });

  return { analyzed, kept };
}
