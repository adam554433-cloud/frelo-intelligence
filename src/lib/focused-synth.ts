import { supabaseAdmin } from "./supabase";
import { ask, extractJSON } from "./claude";
import { BRAND_CONTEXT } from "./brand";
import { embedQuery } from "./embed";

interface FocusedAvatar {
  name: string;
  age_range: string;
  gender_skew: string;
  profile: string;
  discovery_source: string;
  market_size: string;
  where_they_are: string[];
  pain_points: string[];
  desires: string[];
  current_solutions: string[];
  why_current_fails: string;
  purchase_blockers: string[];
  language_patterns: string[];
  emotional_triggers: string[];
  how_frelo_fits: string;
  hooks: Array<{ text: string; type: string; follow_up?: string; why?: string }>;
  marketing_angles: Array<{ name: string; thesis: string; emotional_lever: string; ad_outline: string }>;
  sales_messages: Array<{ headline: string; subheadline: string; body: string; cta: string }>;
  ad_headlines: string[];
  video_script: { concept: string; duration: string; platform: string; hook: string; beats: string[]; cta: string };
  confidence_score: number;
  momentum_score: number;
}

interface FocusedSynthResponse {
  avatars: FocusedAvatar[];
  angle_summary: string;
}

/**
 * Focused synthesis: given a central angle (e.g. "sarcopenia and muscle loss"),
 * find real consumer voice matching that angle via semantic + text search,
 * then ask Claude Opus to identify 2-4 distinct sub-avatars WITHIN that angle.
 *
 * Uses raw items (not clusters) so it works even on freshly scraped, un-analyzed data.
 */
export async function synthesizeFocusedAvatars(opts: {
  angle: string;
  maxItems?: number;
  maxAvatars?: number;
}): Promise<{ synthesized: number; skipped: number; avatars: FocusedAvatar[]; angle: string }> {
  const db = supabaseAdmin();
  const maxItems = opts.maxItems ?? 40;
  const maxAvatars = opts.maxAvatars ?? 4;

  // Phase 1: semantic search for items matching the angle
  let items: Array<{
    id: number;
    content: string;
    platform: string;
    url: string | null;
    frelo_relevance: number | null;
    sub_theme?: string | null;
    category?: string | null;
  }> = [];

  try {
    const vector = await embedQuery(opts.angle);
    const { data: semResults } = await db.rpc("intel_search_items", {
      query_embedding: vector,
      match_threshold: 0.3,
      match_count: maxItems,
      min_relevance: 0,
    });
    if (semResults && Array.isArray(semResults)) {
      items = (semResults as typeof items).map((r) => ({
        id: r.id,
        content: r.content,
        platform: r.platform,
        url: r.url,
        frelo_relevance: r.frelo_relevance,
      }));
    }
  } catch (err) {
    console.error("Focused synth semantic search error:", err);
  }

  // Phase 2: trigram keyword fallback to backfill
  if (items.length < maxItems) {
    const keywords = opts.angle
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3);

    if (keywords.length > 0) {
      const orFilter = keywords.map((kw) => `content.ilike.%${kw}%`).join(",");
      const { data: textResults } = await db
        .from("intel_items")
        .select("id, content, platform, url, frelo_relevance")
        .or(orFilter)
        .order("engagement", { ascending: false })
        .limit(maxItems - items.length);

      const seen = new Set(items.map((i) => i.id));
      for (const row of (textResults ?? []) as typeof items) {
        if (!seen.has(row.id)) {
          items.push(row);
          seen.add(row.id);
        }
      }
    }
  }

  if (items.length === 0) {
    return { synthesized: 0, skipped: 0, avatars: [], angle: opts.angle };
  }

  // Phase 3: Ask Claude Opus to identify sub-avatars within this angle
  const sourceText = items
    .slice(0, maxItems)
    .map((it, i) => `[src${i + 1}] (id=${it.id}, ${it.platform}, relevance=${it.frelo_relevance ?? "?"})\n${it.content.slice(0, 600)}`)
    .join("\n\n");

  const raw = await ask({
    tier: "deep",
    maxTokens: 16000,
    temperature: 0.35,
    system: `You are a world-class consumer researcher for frelo. Your task: given a CENTRAL ANGLE and a collection of real consumer voice data, identify 2-${maxAvatars} DISTINCT sub-avatars that exist WITHIN that angle.

IMPORTANT:
- The sub-avatars must share the central angle (e.g., both care about sarcopenia) but differ in their SPECIFIC motivations, life stage, gender, pain texture, current solutions, etc.
- Every claim must be grounded in the [srcN] evidence — use verbatim quotes wherever possible.
- If the data doesn't clearly support a sub-avatar, create fewer rather than fabricating.
- Diversity matters: don't create near-duplicate sub-avatars.

Return ONLY valid JSON:
{
  "angle_summary": "2-3 sentence summary of what the data reveals about this central angle",
  "avatars": [
    {
      "name": "evocative name for this sub-avatar",
      "age_range": "range grounded in data",
      "gender_skew": "mixed | female-leaning | male-leaning",
      "profile": "4-5 sentences",
      "discovery_source": "which [srcN] items revealed this sub-avatar (cite 2-3)",
      "market_size": "niche | medium | large",
      "where_they_are": ["communities from the data"],
      "pain_points": ["5 specific pain points"],
      "desires": ["3 hidden desires"],
      "current_solutions": ["what they use now"],
      "why_current_fails": "why current solutions fall short",
      "purchase_blockers": ["2-3 blockers"],
      "language_patterns": ["5 EXACT phrases"],
      "emotional_triggers": ["3 triggers"],
      "how_frelo_fits": "specific solution",
      "hooks": [
        {"text": "hook", "type": "curiosity|pain_agitation|myth_bust|pattern_interrupt|social_proof", "follow_up": "next line", "why": "why it works"}
      ],
      "marketing_angles": [
        {"name": "angle name", "thesis": "2-3 sentences", "emotional_lever": "emotion", "ad_outline": "30-60s flow"}
      ],
      "sales_messages": [
        {"headline": "h", "subheadline": "sub", "body": "4 sentence copy", "cta": "cta"}
      ],
      "ad_headlines": ["5 headlines"],
      "video_script": {"concept": "name", "duration": "30s", "platform": "Meta|TikTok|YouTube", "hook": "opener", "beats": ["b1","b2","b3","b4"], "cta": "close"},
      "confidence_score": 1-10,
      "momentum_score": 1-10
    }
  ]
}

${BRAND_CONTEXT}`,
    user: `CENTRAL ANGLE: ${opts.angle}\n\nSOURCE DATA (${items.length} items):\n\n${sourceText}`,
  });

  const parsed = extractJSON<FocusedSynthResponse>(raw);

  // Phase 4: Persist each avatar with provenance
  let synthesized = 0;
  let skipped = 0;
  const persisted: FocusedAvatar[] = [];

  const sourceIds = items.slice(0, maxItems).map((it) => it.id);

  for (const a of parsed.avatars ?? []) {
    try {
      await db.from("intel_avatars").insert({
        name: a.name,
        age_range: a.age_range,
        gender_skew: a.gender_skew,
        profile: a.profile,
        discovery_source: a.discovery_source,
        market_size: a.market_size,
        where_they_are: a.where_they_are ?? [],
        pain_points: a.pain_points ?? [],
        desires: a.desires ?? [],
        current_solutions: a.current_solutions ?? [],
        why_current_fails: a.why_current_fails,
        purchase_blockers: a.purchase_blockers ?? [],
        language_patterns: a.language_patterns ?? [],
        emotional_triggers: a.emotional_triggers ?? [],
        how_frelo_fits: a.how_frelo_fits,
        hooks: a.hooks ?? [],
        marketing_angles: a.marketing_angles ?? [],
        sales_messages: a.sales_messages ?? [],
        ad_headlines: a.ad_headlines ?? [],
        video_script: a.video_script ?? null,
        source_item_ids: sourceIds,
        citation_count: sourceIds.length,
        confidence_score: a.confidence_score,
        momentum_score: a.momentum_score,
      });
      synthesized++;
      persisted.push(a);
    } catch (err) {
      console.error("Focused avatar insert error:", err);
      skipped++;
    }
  }

  await db.from("intel_events").insert({
    kind: "focused_synthesis_finished",
    payload: { angle: opts.angle, synthesized, skipped },
  });

  return { synthesized, skipped, avatars: persisted, angle: opts.angle };
}
