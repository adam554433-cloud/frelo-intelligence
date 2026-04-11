import { supabaseAdmin } from "./supabase";
import { ask, extractJSON } from "./claude";
import { BRAND_CONTEXT } from "./brand";

export interface DailyDigest {
  date: string;
  headline: string;
  what_happened: string;
  top_quotes: Array<{ quote: string; source: string; why_matters: string }>;
  new_alerts: number;
  new_items: number;
  suggested_action: string;
  hypothesis_of_the_day: string;
}

export async function generateDailyDigest(): Promise<DailyDigest> {
  const db = supabaseAdmin();

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [newItemsRes, alertsRes, topItemsRes] = await Promise.all([
    db.from("intel_items").select("*", { count: "exact", head: true }).gte("created_at", since),
    db
      .from("intel_alerts")
      .select("title, body, severity, kind")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(5),
    db
      .from("intel_items")
      .select("content, platform, url, sub_theme, frelo_relevance")
      .gte("created_at", since)
      .gte("frelo_relevance", 7)
      .order("frelo_relevance", { ascending: false })
      .limit(8),
  ]);

  const alertsText = (alertsRes.data ?? [])
    .map((a: Record<string, unknown>) => `- [${a.severity}] ${a.title}: ${String(a.body ?? "").slice(0, 150)}`)
    .join("\n");

  const signalsText = (topItemsRes.data ?? [])
    .map(
      (i: Record<string, unknown>) =>
        `[${i.platform}] ${i.sub_theme ?? "?"}: ${String(i.content).slice(0, 300)}`
    )
    .join("\n\n");

  const raw = await ask({
    tier: "fast",
    maxTokens: 2500,
    temperature: 0.4,
    system: `You are writing a daily intelligence digest for the frelo CMO. It should be readable in 30 seconds.

Return ONLY valid JSON:
{
  "headline": "one-sentence headline capturing the most important thing today",
  "what_happened": "2-3 sentence summary",
  "top_quotes": [
    {"quote": "verbatim quote", "source": "platform + subreddit/source", "why_matters": "1 sentence"}
  ],
  "suggested_action": "one specific action the CMO should consider today",
  "hypothesis_of_the_day": "one sharp hypothesis to test based on today's signals"
}

Keep quotes verbatim from the data. Pick 3 best quotes max. No filler.

${BRAND_CONTEXT}`,
    user: `NEW ITEMS IN LAST 24H: ${newItemsRes.count ?? 0}
NEW ALERTS: ${alertsRes.data?.length ?? 0}

ALERTS:
${alertsText || "(none)"}

TOP RELEVANCE SIGNALS FROM TODAY:
${signalsText || "(no high-relevance items today)"}`,
  });

  const parsed = extractJSON<Omit<DailyDigest, "date" | "new_alerts" | "new_items">>(raw);

  const digest: DailyDigest = {
    date: new Date().toISOString().split("T")[0],
    new_alerts: alertsRes.data?.length ?? 0,
    new_items: newItemsRes.count ?? 0,
    ...parsed,
  };

  // Persist as an event so the dashboard can show it
  await db.from("intel_events").insert({
    kind: "daily_digest",
    payload: digest as unknown as Record<string, unknown>,
  });

  return digest;
}

export async function getLatestDigest(): Promise<DailyDigest | null> {
  const db = supabaseAdmin();
  const { data } = await db
    .from("intel_events")
    .select("payload")
    .eq("kind", "daily_digest")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.payload as DailyDigest) ?? null;
}
