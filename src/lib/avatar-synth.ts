import { supabaseAdmin } from "./supabase";
import { ask, extractJSON } from "./claude";
import { BRAND_CONTEXT } from "./brand";

interface AvatarOutput {
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

interface ClusterRow {
  id: number;
  size: number;
  platforms: string[];
  cross_platform_score: number;
}

/**
 * Synthesize ONE avatar per cluster, grounded in source quotes.
 * Each call uses Claude Opus for deep reasoning.
 */
export async function synthesizeAvatarForCluster(clusterId: number): Promise<AvatarOutput | null> {
  const db = supabaseAdmin();

  // Fetch cluster metadata
  const { data: cluster, error: cErr } = await db
    .from("intel_clusters")
    .select("id, size, platforms, cross_platform_score")
    .eq("id", clusterId)
    .single();

  if (cErr || !cluster) return null;

  // Fetch up to 25 highest-relevance items in this cluster
  const { data: links } = await db
    .from("intel_cluster_items")
    .select("item_id")
    .eq("cluster_id", clusterId)
    .limit(50);

  if (!links || links.length === 0) return null;

  const itemIds = links.map((l) => l.item_id);

  const { data: items } = await db
    .from("intel_items")
    .select("id, content, platform, url, sub_theme, category, key_phrases, frelo_relevance")
    .in("id", itemIds)
    .order("frelo_relevance", { ascending: false })
    .limit(25);

  if (!items || items.length === 0) return null;

  const sourceText = items
    .map((it, i) => `[src${i + 1}] (id=${it.id}, ${it.platform}, ${it.category ?? "?"}) ${it.content.slice(0, 500)}`)
    .join("\n\n");

  const raw = await ask({
    tier: "deep",
    maxTokens: 6000,
    temperature: 0.3,
    system: `You are a world-class consumer researcher and creative strategist for frelo.

You will analyze a cluster of real consumer voice data (each item prefixed [src1], [src2]...) and synthesize ONE coherent audience avatar. EVERY claim you make must be grounded in the source data — use verbatim quotes wherever possible. Do not invent demographics, pain points, or phrases. If the data doesn't support it, don't claim it.

Return ONLY valid JSON:
{
  "name": "evocative avatar name",
  "age_range": "range based on data",
  "gender_skew": "mixed | female-leaning | male-leaning",
  "profile": "4-5 sentences grounded in the data",
  "discovery_source": "which [srcN] items revealed this (quote 2-3)",
  "market_size": "niche | medium | large",
  "where_they_are": ["platforms and communities from the data"],
  "pain_points": ["5 specific pain points, verbatim or paraphrased from data"],
  "desires": ["3 hidden desires"],
  "current_solutions": ["what they use now"],
  "why_current_fails": "why current solutions fall short",
  "purchase_blockers": ["2-3 blockers"],
  "language_patterns": ["5 EXACT phrases from the data"],
  "emotional_triggers": ["3 triggers"],
  "how_frelo_fits": "specifically how frelo solves this avatar's problem",
  "hooks": [
    {"text": "hook line", "type": "curiosity|pain_agitation|myth_bust|pattern_interrupt|social_proof", "follow_up": "next line", "why": "why it works"},
    ...3 total
  ],
  "marketing_angles": [
    {"name": "angle name", "thesis": "2-3 sentence argument", "emotional_lever": "the emotion", "ad_outline": "30-60s ad flow"},
    ...2 total
  ],
  "sales_messages": [
    {"headline": "h", "subheadline": "sub", "body": "4 sentence copy: problem > agitation > solution > proof", "cta": "call to action"}
  ],
  "ad_headlines": ["5 headlines"],
  "video_script": {
    "concept": "name",
    "duration": "30s",
    "platform": "Meta|TikTok|YouTube",
    "hook": "opening 3 sec",
    "beats": ["beat 1", "beat 2", "beat 3", "beat 4"],
    "cta": "closing"
  },
  "confidence_score": 1-10,
  "momentum_score": 1-10
}

${BRAND_CONTEXT}`,
    user: `Cluster size: ${cluster.size}, platforms: ${cluster.platforms.join(", ")}, cross-platform score: ${cluster.cross_platform_score}\n\n${sourceText}`,
  });

  try {
    const avatar = extractJSON<AvatarOutput>(raw);

    // Persist
    await db.from("intel_avatars").insert({
      name: avatar.name,
      age_range: avatar.age_range,
      gender_skew: avatar.gender_skew,
      profile: avatar.profile,
      discovery_source: avatar.discovery_source,
      market_size: avatar.market_size,
      where_they_are: avatar.where_they_are ?? [],
      pain_points: avatar.pain_points ?? [],
      desires: avatar.desires ?? [],
      current_solutions: avatar.current_solutions ?? [],
      why_current_fails: avatar.why_current_fails,
      purchase_blockers: avatar.purchase_blockers ?? [],
      language_patterns: avatar.language_patterns ?? [],
      emotional_triggers: avatar.emotional_triggers ?? [],
      how_frelo_fits: avatar.how_frelo_fits,
      hooks: avatar.hooks ?? [],
      marketing_angles: avatar.marketing_angles ?? [],
      sales_messages: avatar.sales_messages ?? [],
      ad_headlines: avatar.ad_headlines ?? [],
      video_script: avatar.video_script ?? null,
      source_item_ids: itemIds,
      citation_count: itemIds.length,
      confidence_score: avatar.confidence_score,
      momentum_score: avatar.momentum_score,
      cluster_ids: [clusterId],
    });

    return avatar;
  } catch (err) {
    console.error("Avatar synth JSON parse error:", err);
    return null;
  }
}

export async function synthesizeAllAvatars(opts: { maxClusters?: number } = {}): Promise<{
  synthesized: number;
  skipped: number;
}> {
  const db = supabaseAdmin();
  const max = opts.maxClusters ?? 8;

  const { data: clusters } = await db
    .from("intel_clusters")
    .select("id, size, cross_platform_score")
    .order("cross_platform_score", { ascending: false })
    .order("size", { ascending: false })
    .limit(max);

  if (!clusters || clusters.length === 0) return { synthesized: 0, skipped: 0 };

  let synthesized = 0;
  let skipped = 0;

  for (const c of clusters) {
    try {
      const result = await synthesizeAvatarForCluster(c.id);
      if (result) synthesized++;
      else skipped++;
    } catch {
      skipped++;
    }
  }

  await db.from("intel_events").insert({
    kind: "synthesis_finished",
    payload: { synthesized, skipped, max },
  });

  return { synthesized, skipped };
}
