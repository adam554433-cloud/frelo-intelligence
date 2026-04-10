import { supabaseAdmin } from "./supabase";
import { ask, extractJSON } from "./claude";
import { BRAND_CONTEXT } from "./brand";

export interface PersonaReaction {
  avatar_id: number;
  avatar_name: string;
  verdict: "click" | "scroll" | "ignore" | "eye_roll";
  score: number;
  reaction: string;
  would_buy: "yes" | "maybe" | "no";
  objection: string | null;
}

export async function simulateAdCopy(adCopy: string, avatarIds?: number[]): Promise<PersonaReaction[]> {
  const db = supabaseAdmin();

  let query = db.from("intel_avatars").select("*").eq("status", "active").order("confidence_score", { ascending: false });
  if (avatarIds && avatarIds.length > 0) query = query.in("id", avatarIds);

  const { data: avatars, error } = await query.limit(6);
  if (error || !avatars || avatars.length === 0) return [];

  const reactions: PersonaReaction[] = [];

  for (const avatar of avatars) {
    try {
      const raw = await ask({
        tier: "fast",
        maxTokens: 800,
        temperature: 0.6,
        system: `You are roleplaying as ${avatar.name}, a real consumer with the following profile. React AUTHENTICALLY to ad copy as this person would — don't be nice, don't hedge. If the copy is generic or gym-bro, eye-roll. If it speaks to your actual pain, engage.

YOUR PROFILE:
Age: ${avatar.age_range}
Profile: ${avatar.profile}
Your pain points: ${JSON.stringify(avatar.pain_points)}
Your desires: ${JSON.stringify(avatar.desires)}
Your language: ${JSON.stringify(avatar.language_patterns)}
Your emotional triggers: ${JSON.stringify(avatar.emotional_triggers)}
Your purchase blockers: ${JSON.stringify(avatar.purchase_blockers)}

Return ONLY JSON:
{
  "verdict": "click | scroll | ignore | eye_roll",
  "score": 0-10,
  "reaction": "your internal reaction in YOUR voice, using phrases from your language patterns (2-3 sentences)",
  "would_buy": "yes | maybe | no",
  "objection": "your strongest objection if any, or null"
}`,
        user: `Ad copy to react to:\n${adCopy}`,
      });

      const parsed = extractJSON<Omit<PersonaReaction, "avatar_id" | "avatar_name">>(raw);
      reactions.push({
        avatar_id: avatar.id,
        avatar_name: avatar.name,
        ...parsed,
      });
    } catch (err) {
      console.error(`Persona sim error for avatar ${avatar.id}:`, err);
    }
  }

  return reactions;
}

export async function redTeamClaim(claim: string): Promise<{
  hidden_assumptions: string[];
  counter_arguments: string[];
  evidence_gaps: string[];
  risk_level: "low" | "medium" | "high";
  refined_claim: string;
}> {
  const raw = await ask({
    tier: "deep",
    maxTokens: 2000,
    temperature: 0.3,
    system: `You are an adversarial critic for frelo. Your job is to tear apart brand claims and surface hidden assumptions. Be rigorous, not polite.

Return ONLY JSON:
{
  "hidden_assumptions": ["assumption 1", "assumption 2", ...],
  "counter_arguments": ["the strongest argument against this claim", ...],
  "evidence_gaps": ["what evidence would be needed to support this"],
  "risk_level": "low | medium | high",
  "refined_claim": "a tighter version of the claim that survives your critique"
}

${BRAND_CONTEXT}`,
    user: `Claim to red-team: ${claim}`,
  });

  return extractJSON(raw);
}
