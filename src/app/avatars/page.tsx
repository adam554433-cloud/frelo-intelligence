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
      .select("id, name, age_range, profile, confidence_score, momentum_score, citation_count, pain_points")
      .eq("status", "active")
      .order("confidence_score", { ascending: false })
      .limit(50);
    return data ?? [];
  } catch {
    return [];
  }
}

export default async function AvatarsPage() {
  const avatars = await getAvatars();

  return (
    <Shell>
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <div className="text-sm uppercase tracking-[0.2em] text-accent-light">avatars</div>
          <h1 className="mt-2 font-serif text-4xl font-semibold">Audiences discovered from the data.</h1>
        </div>

        {avatars.length === 0 ? (
          <EmptyState
            icon="Users"
            title="No avatars yet."
            body="Avatars are synthesized by clustering embedded items, then asking Claude Opus to profile each cluster with grounded quotes."
            hint="Run: /api/ingest/run → /api/analyze → /api/embed → /api/cluster → /api/synthesize"
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {avatars.map((a) => (
              <Link
                key={a.id}
                href={`/avatars/${a.id}`}
                className="group rounded-card border border-surface-border bg-surface p-6 transition-all hover:border-accent/40 hover:bg-surface-hover"
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
                <p className="line-clamp-3 text-sm text-text-secondary">{a.profile}</p>
                <div className="mt-4 flex items-center gap-3 text-xs text-text-muted">
                  <span>{a.citation_count ?? 0} sources</span>
                  {a.momentum_score ? <span>· momentum {a.momentum_score}</span> : null}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}
