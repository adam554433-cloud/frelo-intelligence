import { supabaseAdmin } from "./supabase";

export interface CreativeBrief {
  avatar_id: number;
  avatar_name: string;
  avatar_profile: string;
  age_range: string | null;

  // What to say
  hook: string;
  hook_type: string;
  pain_point: string;
  desire: string;
  emotional_lever: string;
  how_frelo_fits: string;

  // Exact language
  verbatim_phrases: string[];
  avoid_language: string[];

  // Format
  headlines: string[];
  body_copy: string;
  cta: string;
  video_script: {
    concept: string;
    duration: string;
    platform: string;
    hook: string;
    beats: string[];
    cta: string;
  } | null;

  // Provenance
  source_item_ids: number[];
  confidence: number;
}

/**
 * Export an avatar as a Creative Brief — ready to hand off to frelo-creative-hub.
 * Returns a JSON format that can be consumed by the Static Ad Engine.
 */
export async function exportCreativeBrief(avatarId: number, angleIndex = 0): Promise<CreativeBrief> {
  const db = supabaseAdmin();
  const { data: avatar, error } = await db
    .from("intel_avatars")
    .select("*")
    .eq("id", avatarId)
    .single();

  if (error || !avatar) throw new Error(`avatar ${avatarId} not found`);

  const angle = (avatar.marketing_angles as Array<{ name: string; thesis: string; emotional_lever: string; ad_outline: string }>)?.[angleIndex] ?? null;
  const hook = (avatar.hooks as Array<{ text: string; type: string }>)?.[0] ?? { text: "", type: "curiosity" };
  const sales = (avatar.sales_messages as Array<{ headline: string; subheadline: string; body: string; cta: string }>)?.[0];

  return {
    avatar_id: avatar.id,
    avatar_name: avatar.name,
    avatar_profile: avatar.profile,
    age_range: avatar.age_range,
    hook: hook.text,
    hook_type: hook.type,
    pain_point: ((avatar.pain_points as string[]) ?? [])[0] ?? "",
    desire: ((avatar.desires as string[]) ?? [])[0] ?? "",
    emotional_lever: angle?.emotional_lever ?? "",
    how_frelo_fits: avatar.how_frelo_fits,
    verbatim_phrases: (avatar.language_patterns as string[]) ?? [],
    avoid_language: ["CRUSH", "BEAST MODE", "GAINS", "GYM BRO", "SHREDDED"],
    headlines: (avatar.ad_headlines as string[]) ?? [],
    body_copy: sales?.body ?? "",
    cta: sales?.cta ?? "Try frelo",
    video_script: avatar.video_script,
    source_item_ids: avatar.source_item_ids ?? [],
    confidence: avatar.confidence_score ?? 0,
  };
}
