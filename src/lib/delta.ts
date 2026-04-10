import { supabaseAdmin } from "./supabase";
import { ask, extractJSON } from "./claude";
import { BRAND_CONTEXT } from "./brand";

/**
 * Delta detection: compares last 24h of activity to the prior 7 days,
 * surfacing new themes, competitor complaint spikes, and narrative shifts.
 */
export async function runDeltaDetection(): Promise<{ alerts: number }> {
  const db = supabaseAdmin();

  const now = new Date();
  const day = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const week = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Recent (last 24h)
  const { data: recent } = await db
    .from("intel_items")
    .select("id, sub_theme, category, frelo_relevance, content")
    .gte("created_at", day.toISOString())
    .gte("frelo_relevance", 5)
    .limit(500);

  // Baseline (prior 7 days, excluding last 24h)
  const { data: baseline } = await db
    .from("intel_items")
    .select("id, sub_theme, category")
    .gte("created_at", week.toISOString())
    .lt("created_at", day.toISOString())
    .gte("frelo_relevance", 5)
    .limit(2000);

  if (!recent || recent.length === 0) return { alerts: 0 };

  // Count theme frequencies
  const recentCount = new Map<string, number>();
  for (const r of recent) {
    if (r.sub_theme) recentCount.set(r.sub_theme, (recentCount.get(r.sub_theme) ?? 0) + 1);
  }
  const baseCount = new Map<string, number>();
  for (const b of baseline ?? []) {
    if (b.sub_theme) baseCount.set(b.sub_theme, (baseCount.get(b.sub_theme) ?? 0) + 1);
  }

  // Find themes with significant growth or entirely new
  const deltas: Array<{ theme: string; recent: number; baseline: number; growth: number }> = [];
  for (const [theme, count] of recentCount.entries()) {
    const base = baseCount.get(theme) ?? 0;
    // new theme (at least 3 recent mentions and no baseline) or >3x growth
    if ((base === 0 && count >= 3) || (base > 0 && count / base >= 3 && count >= 5)) {
      deltas.push({ theme, recent: count, baseline: base, growth: base === 0 ? count : count / base });
    }
  }

  deltas.sort((a, b) => b.growth - a.growth);
  const topDeltas = deltas.slice(0, 5);

  if (topDeltas.length === 0) return { alerts: 0 };

  // Ask Claude to interpret each delta
  const raw = await ask({
    tier: "fast",
    maxTokens: 3000,
    temperature: 0.4,
    system: `You are frelo's intelligence analyst. Given thematic deltas from the last 24h, write concise alerts for the CMO. Focus on what is STRATEGICALLY actionable.

Return ONLY JSON:
{
  "alerts": [
    {
      "title": "headline ≤10 words",
      "body": "2-3 sentences — what changed, why it matters for frelo, what to do",
      "severity": "info | warning | critical"
    }
  ]
}

${BRAND_CONTEXT}`,
    user: `Deltas in the last 24h:\n${topDeltas.map((d) => `- "${d.theme}" — ${d.recent} recent mentions vs ${d.baseline} baseline (${d.growth.toFixed(1)}× growth)`).join("\n")}`,
  });

  try {
    const parsed = extractJSON<{ alerts: Array<{ title: string; body: string; severity: string }> }>(raw);
    for (const a of parsed.alerts ?? []) {
      await db.from("intel_alerts").insert({
        kind: "new_theme",
        severity: a.severity ?? "info",
        title: a.title,
        body: a.body,
      });
    }
    return { alerts: parsed.alerts?.length ?? 0 };
  } catch {
    return { alerts: 0 };
  }
}
