import Link from "next/link";
import { Shell } from "@/components/Shell";
import { EmptyState } from "@/components/EmptyState";
import { supabaseAdmin } from "@/lib/supabase";

export const revalidate = 0;
export const dynamic = "force-dynamic";

async function getAvatars() {
  try {
    const db = supabaseAdmin();
    const { data } = await db
      .from("intel_avatars")
      .select("id, name, age_range, profile, confidence_score, momentum_score, citation_count, pain_points, desires")
      .eq("status", "active")
      .order("confidence_score", { ascending: false })
      .limit(50);
    return data ?? [];
  } catch {
    return [];
  }
}

const TOPIC_PATTERNS: Array<{ label: string; re: RegExp }> = [
  { label: "sarcopenia", re: /\bsarcopenia\b/i },
  { label: "brain fog", re: /brain fog|foggy|mental fatigue/i },
  { label: "brain function", re: /\b(brain|cognit|memory|nootropic|sharp|mental clarity|focus)\b/i },
  { label: "muscle loss", re: /muscle (loss|mass|tone|decline|wasting)|anabolic resistance/i },
  { label: "menopause", re: /menopaus|perimenopaus|postmenopaus|estrogen/i },
  { label: "aging", re: /\b(aging|ageing|longevity|anti[- ]aging|decline fighter|elder)\b/i },
  { label: "vegan", re: /\b(vegan|plant[- ]based|plant powered|plant-powered)\b/i },
  { label: "gut health", re: /\bgut\b|prebiotic|bloat|digestiv|fiber/i },
  { label: "recovery", re: /\brecovery\b|oxidative|glycogen|post[- ]workout/i },
  { label: "absorption", re: /absorption|bioavailab|delivery|transporter/i },
];

function extractTopics(a: {
  profile?: string | null;
  pain_points?: string[] | null;
  desires?: string[] | null;
  name?: string | null;
}): string[] {
  const haystack = [
    a.name ?? "",
    a.profile ?? "",
    ...(Array.isArray(a.pain_points) ? a.pain_points : []),
    ...(Array.isArray(a.desires) ? a.desires : []),
  ].join(" ");
  const hits: string[] = [];
  for (const { label, re } of TOPIC_PATTERNS) {
    if (re.test(haystack)) hits.push(label);
    if (hits.length >= 4) break;
  }
  if (hits.includes("brain fog") && hits.includes("brain function")) {
    return hits.filter((h) => h !== "brain function");
  }
  return hits;
}

export default async function AvatarsPage() {
  const avatars = await getAvatars();

  return (
    <Shell>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-10">
        <div className="mb-6 sm:mb-8">
          <div className="text-xs sm:text-sm uppercase tracking-[0.2em] text-accent-light">avatars</div>
          <h1 className="mt-2 font-serif text-3xl sm:text-4xl font-semibold">Audiences discovered from the data.</h1>
        </div>

        {avatars.length === 0 ? (
          <EmptyState
            icon="Users"
            title="No avatars yet."
            body="Avatars are synthesized by clustering embedded items, then asking Claude Opus to profile each cluster with grounded quotes."
            hint="Run: /api/ingest/run → /api/analyze → /api/embed → /api/cluster → /api/synthesize"
          />
        ) : (
          <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {avatars.map((a) => {
              const topics = extractTopics(a);
              return (
                <Link
                  key={a.id}
                  href={`/avatars/${a.id}`}
                  className="group rounded-card border border-surface-border bg-surface p-5 sm:p-6 transition-all hover:border-accent/40 hover:bg-surface-hover active:bg-surface-hover"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h3 className="font-serif text-xl font-semibold leading-tight text-text-primary">{a.name}</h3>
                    {a.confidence_score ? (
                      <span className="shrink-0 rounded-pill bg-accent/15 px-2 py-0.5 text-xs text-accent-light">
                        {a.confidence_score}/10
                      </span>
                    ) : null}
                  </div>
                  <div className="mb-3 text-xs text-text-muted">{a.age_range ?? ""}</div>
                  {topics.length > 0 ? (
                    <div className="mb-3 flex flex-wrap gap-1.5">
                      {topics.map((t) => (
                        <span
                          key={t}
                          className="rounded-pill border border-accent/30 bg-accent/10 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-accent-light"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <p className="line-clamp-3 text-sm text-text-secondary">{a.profile}</p>
                  <div className="mt-4 flex items-center gap-3 text-xs text-text-muted">
                    <span>{a.citation_count ?? 0} sources</span>
                    {a.momentum_score ? <span>· momentum {a.momentum_score}</span> : null}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </Shell>
  );
}
