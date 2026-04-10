import { Shell } from "@/components/Shell";
import { supabaseAdmin } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Download, Users } from "lucide-react";

export const revalidate = 0;
export const dynamic = "force-dynamic";

async function getAvatar(id: number) {
  try {
    const db = supabaseAdmin();
    const { data } = await db.from("intel_avatars").select("*").eq("id", id).single();
    return data;
  } catch {
    return null;
  }
}

async function getSources(ids: number[]) {
  if (!ids || ids.length === 0) return [];
  try {
    const db = supabaseAdmin();
    const { data } = await db
      .from("intel_items")
      .select("id, content, platform, url, frelo_relevance")
      .in("id", ids)
      .order("frelo_relevance", { ascending: false })
      .limit(15);
    return data ?? [];
  } catch {
    return [];
  }
}

export default async function AvatarDetailPage({ params }: { params: { id: string } }) {
  const avatar = await getAvatar(Number(params.id));
  if (!avatar) notFound();
  const sources = await getSources((avatar.source_item_ids as number[]) ?? []);

  const hooks = (avatar.hooks as Array<{ text: string; type: string; follow_up?: string; why?: string }>) ?? [];
  const angles = (avatar.marketing_angles as Array<{ name: string; thesis: string; emotional_lever: string; ad_outline: string }>) ?? [];
  const sales = (avatar.sales_messages as Array<{ headline: string; subheadline: string; body: string; cta: string }>) ?? [];
  const script = avatar.video_script as { concept: string; duration: string; platform: string; hook: string; beats: string[]; cta: string } | null;

  return (
    <Shell>
      <div className="mx-auto max-w-5xl px-6 py-10">
        <Link href="/avatars" className="mb-4 inline-flex items-center gap-1 text-sm text-text-muted hover:text-accent-light">
          <Users className="h-3 w-3" /> All avatars
        </Link>

        <div className="mb-8">
          <h1 className="font-serif text-4xl font-semibold">{avatar.name}</h1>
          <div className="mt-2 flex flex-wrap gap-3 text-sm text-text-secondary">
            <span>{avatar.age_range}</span>
            {avatar.gender_skew && <span>· {avatar.gender_skew}</span>}
            <span>· {avatar.market_size} market</span>
            <span>· confidence {avatar.confidence_score}/10</span>
            <span>· {avatar.citation_count ?? 0} sources</span>
          </div>
          <p className="mt-4 max-w-2xl text-text-primary">{avatar.profile}</p>

          <a
            href={`/api/avatars/export?id=${avatar.id}`}
            className="mt-5 inline-flex items-center gap-2 rounded-card bg-accent-gradient px-5 py-2.5 font-medium text-chocolate"
          >
            <Download className="h-4 w-4" />
            Export creative brief
          </a>
        </div>

        <Section title="🔴 Pain points">
          <List items={(avatar.pain_points as string[]) ?? []} accent="danger" />
        </Section>

        <Section title="💚 Hidden desires">
          <List items={(avatar.desires as string[]) ?? []} accent="success" />
        </Section>

        <Section title="💬 Verbatim language">
          <div className="flex flex-wrap gap-2">
            {((avatar.language_patterns as string[]) ?? []).map((l, i) => (
              <span key={i} className="rounded-pill border border-accent/30 bg-accent/5 px-3 py-1 text-sm text-accent-light">
                &ldquo;{l}&rdquo;
              </span>
            ))}
          </div>
        </Section>

        <Section title="🧠 Emotional triggers">
          <List items={(avatar.emotional_triggers as string[]) ?? []} accent="accent" />
        </Section>

        {avatar.how_frelo_fits && (
          <Section title="✅ How frelo fits">
            <p className="text-text-primary">{avatar.how_frelo_fits}</p>
          </Section>
        )}

        {hooks.length > 0 && (
          <Section title={`🪝 Hooks (${hooks.length})`}>
            <div className="grid gap-3 sm:grid-cols-2">
              {hooks.map((h, i) => (
                <div key={i} className="rounded-card border border-surface-border bg-chocolate-light/30 p-4">
                  <div className="mb-2 text-xs uppercase tracking-wider text-accent-light">{h.type}</div>
                  <div className="font-serif text-lg text-text-primary">{h.text}</div>
                  {h.follow_up && <div className="mt-2 text-sm text-text-secondary">→ {h.follow_up}</div>}
                  {h.why && <div className="mt-2 text-xs text-text-muted italic">{h.why}</div>}
                </div>
              ))}
            </div>
          </Section>
        )}

        {angles.length > 0 && (
          <Section title={`🎯 Marketing angles`}>
            <div className="space-y-4">
              {angles.map((a, i) => (
                <div key={i} className="rounded-card border border-surface-border bg-chocolate-light/30 p-5">
                  <div className="font-serif text-lg font-semibold text-accent-light">{a.name}</div>
                  <div className="mt-1 text-xs uppercase tracking-wider text-text-muted">lever: {a.emotional_lever}</div>
                  <p className="mt-2 text-text-primary">{a.thesis}</p>
                  <p className="mt-2 text-sm text-text-secondary">{a.ad_outline}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {sales.length > 0 && (
          <Section title="📝 Sales messages">
            {sales.map((s, i) => (
              <div key={i} className="rounded-card border border-surface-border bg-chocolate-light/30 p-5 mb-3">
                <div className="font-serif text-xl text-text-primary">{s.headline}</div>
                <div className="mt-1 text-accent-light">{s.subheadline}</div>
                <p className="mt-3 text-text-secondary">{s.body}</p>
                <div className="mt-3 inline-block rounded-pill bg-accent-gradient px-4 py-1 text-sm font-medium text-chocolate">{s.cta}</div>
              </div>
            ))}
          </Section>
        )}

        {script && (
          <Section title="🎬 Video script">
            <div className="rounded-card border border-surface-border bg-chocolate-light/30 p-5">
              <div className="font-serif text-lg font-semibold text-text-primary">{script.concept}</div>
              <div className="mt-1 text-xs text-text-muted">
                {script.duration} · {script.platform}
              </div>
              <div className="mt-4">
                <div className="text-xs uppercase tracking-wider text-accent-light">Hook</div>
                <div className="mt-1 text-text-primary">{script.hook}</div>
              </div>
              {script.beats && (
                <div className="mt-4">
                  <div className="text-xs uppercase tracking-wider text-accent-light">Beats</div>
                  <ol className="mt-1 space-y-1">
                    {script.beats.map((b, i) => (
                      <li key={i} className="text-sm text-text-secondary">
                        {i + 1}. {b}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              <div className="mt-4">
                <div className="text-xs uppercase tracking-wider text-accent-light">CTA</div>
                <div className="mt-1 text-text-primary">{script.cta}</div>
              </div>
            </div>
          </Section>
        )}

        {sources.length > 0 && (
          <Section title={`📡 Grounded in ${sources.length} sources`}>
            <div className="space-y-2">
              {sources.map((s) => (
                <a
                  key={s.id}
                  href={s.url ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-card border border-surface-border bg-chocolate-light/20 p-3 text-sm transition-colors hover:border-accent/30"
                >
                  <div className="flex items-center gap-2 text-xs text-accent-light">
                    <span className="uppercase">{s.platform}</span>
                    {s.frelo_relevance && <span className="text-text-muted">· relevance {s.frelo_relevance}/10</span>}
                  </div>
                  <div className="mt-1 line-clamp-2 text-text-secondary">{s.content}</div>
                </a>
              ))}
            </div>
          </Section>
        )}
      </div>
    </Shell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="mb-3 text-xs uppercase tracking-wider text-accent-light">{title}</h2>
      {children}
    </div>
  );
}

function List({ items, accent }: { items: string[]; accent: "danger" | "success" | "accent" }) {
  const colors = {
    danger: "border-danger/40 bg-danger/5",
    success: "border-success/40 bg-success/5",
    accent: "border-accent/40 bg-accent/5",
  };
  return (
    <ul className="space-y-2">
      {items.map((it, i) => (
        <li key={i} className={`rounded-card border ${colors[accent]} px-4 py-2.5 text-text-primary`}>
          {it}
        </li>
      ))}
    </ul>
  );
}
