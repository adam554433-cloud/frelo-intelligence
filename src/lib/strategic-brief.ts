import { supabaseAdmin } from "./supabase";
import { ask, extractJSON } from "./claude";
import { BRAND_CONTEXT } from "./brand";

export interface StrategicBrief {
  title: string;
  executive_summary: string;
  narrative_shift: {
    from: string;
    to: string;
    evidence: string;
    confidence: number;
  };
  positioning_recommendation: string;
  target_avatars: Array<{ id: number; name: string; why: string }>;
  top_3_hooks: string[];
  competitive_intelligence: {
    biggest_gap_to_exploit: string;
    biggest_threat: string;
    defensive_move: string;
  };
  budget_allocation: {
    awareness: number;
    conversion: number;
    defensive: number;
    rationale: string;
  };
  hypotheses_to_validate: string[];
  risks: string[];
  kpis: string[];
  next_30_days: string[];
}

export async function generateStrategicBrief(opts: {
  focus?: string;
  horizon?: "this_month" | "this_quarter" | "this_year";
}): Promise<StrategicBrief> {
  const db = supabaseAdmin();
  const horizon = opts.horizon ?? "this_quarter";

  // Gather current intel state
  const [avatarsRes, alertsRes, hypsRes, topItemsRes] = await Promise.all([
    db
      .from("intel_avatars")
      .select("id, name, age_range, profile, pain_points, desires, confidence_score, momentum_score, how_frelo_fits")
      .eq("status", "active")
      .order("confidence_score", { ascending: false })
      .limit(15),
    db.from("intel_alerts").select("title, body, kind, severity").order("created_at", { ascending: false }).limit(10),
    db
      .from("intel_hypotheses")
      .select("statement, status, verdict, confidence_score")
      .not("verdict", "is", null)
      .limit(10),
    db
      .from("intel_items")
      .select("content, platform, sub_theme, category, frelo_relevance")
      .gte("frelo_relevance", 7)
      .not("sub_theme", "is", null)
      .order("frelo_relevance", { ascending: false })
      .limit(30),
  ]);

  const avatarsBlock = (avatarsRes.data ?? [])
    .map(
      (a: Record<string, unknown>, i: number) =>
        `[${i + 1}] id=${a.id} "${a.name}" (${a.age_range}) conf=${a.confidence_score}/10 momentum=${a.momentum_score}
  profile: ${String(a.profile).slice(0, 200)}
  top pain: ${Array.isArray(a.pain_points) ? (a.pain_points as string[])[0] : ""}
  frelo fit: ${String(a.how_frelo_fits ?? "").slice(0, 150)}`
    )
    .join("\n\n");

  const alertsBlock = (alertsRes.data ?? [])
    .map((a: Record<string, unknown>) => `- [${a.severity}] ${a.title}: ${String(a.body ?? "").slice(0, 150)}`)
    .join("\n");

  const hypsBlock = (hypsRes.data ?? [])
    .map(
      (h: Record<string, unknown>) =>
        `- "${h.statement}" → ${h.status} (${h.confidence_score}%): ${String(h.verdict ?? "").slice(0, 150)}`
    )
    .join("\n");

  const signalsBlock = (topItemsRes.data ?? [])
    .map((i: Record<string, unknown>) => `[${i.platform}] ${i.sub_theme}: ${String(i.content).slice(0, 200)}`)
    .join("\n");

  const raw = await ask({
    tier: "deep",
    maxTokens: 8000,
    temperature: 0.3,
    system: `You are the Chief Marketing Officer for frelo. You are writing a strategic brief for the leadership team based on the latest consumer intelligence.

This is NOT an ad brief — it is a C-suite level strategic recommendation about positioning, narrative, budget, and defense. Be direct and opinionated. Ground every recommendation in the avatar/alert/hypothesis data provided.

Return ONLY valid JSON in this structure:
{
  "title": "evocative 6-8 word title for this brief",
  "executive_summary": "3-4 sentence executive summary — what's the one thing leadership must know",
  "narrative_shift": {
    "from": "the old narrative frelo was riding",
    "to": "the new narrative emerging in the data",
    "evidence": "1-2 sentences citing which avatars/alerts reveal this shift",
    "confidence": 0-100
  },
  "positioning_recommendation": "2-3 sentences on how frelo should position itself given this data",
  "target_avatars": [
    {"id": <avatar id>, "name": "name", "why": "why this avatar is the priority"}
  ],
  "top_3_hooks": ["hook 1", "hook 2", "hook 3"],
  "competitive_intelligence": {
    "biggest_gap_to_exploit": "what competitors are missing",
    "biggest_threat": "what competitors are doing that frelo should defend against",
    "defensive_move": "specific action to take"
  },
  "budget_allocation": {
    "awareness": 0-100,
    "conversion": 0-100,
    "defensive": 0-100,
    "rationale": "why this split"
  },
  "hypotheses_to_validate": ["3 specific hypotheses to test ${horizon}"],
  "risks": ["top 3 risks"],
  "kpis": ["3 measurable KPIs to track"],
  "next_30_days": ["4-6 specific actions"]
}

Pick exactly 2-3 target avatars from the list. Use their actual IDs. Budget percentages must sum to 100.

${BRAND_CONTEXT}`,
    user: `FOCUS: ${opts.focus ?? "general strategic review"}
HORIZON: ${horizon}

AVATARS (top by confidence):
${avatarsBlock}

RECENT ALERTS:
${alertsBlock || "(none)"}

TESTED HYPOTHESES:
${hypsBlock || "(none)"}

TOP CONSUMER SIGNALS (by frelo relevance):
${signalsBlock || "(none)"}
`,
  });

  return extractJSON<StrategicBrief>(raw);
}
