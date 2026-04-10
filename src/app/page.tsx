import Link from "next/link";
import { Shell } from "@/components/Shell";
import { StatCard } from "@/components/StatCard";
import { ArrowRight, Sparkles } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase";

export const revalidate = 0;
export const dynamic = "force-dynamic";

async function getStats() {
  try {
    const db = supabaseAdmin();
    const [itemsRes, avatarsRes, hypsRes, alertsListRes, sourcesRes, recentAlertsRes] = await Promise.all([
      db.from("intel_items").select("*", { count: "exact", head: true }),
      db.from("intel_avatars").select("*", { count: "exact", head: true }).eq("status", "active"),
      db.from("intel_hypotheses").select("*", { count: "exact", head: true }),
      db.from("intel_alerts").select("seen"),
      db.from("intel_sources").select("*", { count: "exact", head: true }),
      db.from("intel_alerts").select("id, title, body, severity, created_at").order("created_at", { ascending: false }).limit(3),
    ]);
    const unreadAlerts = ((alertsListRes.data as Array<{ seen: boolean }>) ?? []).filter((a) => !a.seen).length;

    return {
      items: itemsRes.count ?? 0,
      avatars: avatarsRes.count ?? 0,
      hypotheses: hypsRes.count ?? 0,
      alerts: unreadAlerts,
      sources: sourcesRes.count ?? 0,
      recentAlerts: (recentAlertsRes.data ?? []) as Array<{ id: number; title: string; body: string; severity: string; created_at: string }>,
      ok: true,
    };
  } catch {
    return { items: 0, avatars: 0, hypotheses: 0, alerts: 0, sources: 0, recentAlerts: [], ok: false };
  }
}

export default async function DashboardPage() {
  const stats = await getStats();

  return (
    <Shell>
      <div className="mx-auto max-w-6xl px-6 py-10 sm:py-14">
        <div className="mb-10">
          <div className="mb-3 flex items-center gap-2 text-sm text-accent-light">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-light animate-pulse-slow" />
            <span className="uppercase tracking-[0.2em]">brand brain · {stats.ok ? "connected" : "setup pending"}</span>
          </div>
          <h1 className="font-serif text-4xl font-semibold leading-tight sm:text-5xl">
            What do you want to <span className="bg-brand-gradient bg-clip-text text-transparent">know</span>?
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-text-secondary">
            A living intelligence engine for frelo. Test hypotheses, discover avatars, track competitors — all grounded in real consumer voice.
          </p>
        </div>

        <Link
          href="/chat"
          className="group mb-10 block rounded-card border border-surface-border bg-surface p-8 transition-all hover:border-accent/40 hover:bg-surface-hover"
        >
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-2 text-sm text-accent-light">
                <Sparkles className="h-4 w-4" />
                Ask Anything
              </div>
              <div className="font-serif text-2xl text-text-primary">
                &ldquo;Why are women 45-60 underserved in creatine?&rdquo;
              </div>
              <div className="mt-2 text-sm text-text-secondary">
                Chat with your brand&apos;s collective intelligence. Every answer cited to real sources.
              </div>
            </div>
            <ArrowRight className="h-6 w-6 text-text-muted transition-all group-hover:translate-x-1 group-hover:text-accent-light" />
          </div>
        </Link>

        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Items ingested" value={stats.items.toLocaleString()} hint={`${stats.sources} sources`} icon="Database" />
          <StatCard label="Avatars" value={stats.avatars} hint="grounded in data" icon="Users" accent />
          <StatCard label="Hypotheses" value={stats.hypotheses} hint="open / tested" icon="FlaskConical" />
          <StatCard label="Alerts" value={stats.alerts} hint="unread" icon="Bell" />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <QuickAction href="/hypotheses" title="Test a hypothesis" body="Write what you believe. The engine finds proof or disproof." />
          <QuickAction href="/avatars" title="Explore avatars" body="Audiences discovered from the voice of real consumers." />
          <QuickAction href="/simulate" title="Simulate personas" body="Test ad copy against synthetic customers before production." />
        </div>

        {stats.recentAlerts.length > 0 && (
          <div className="mt-10">
            <h2 className="mb-4 font-serif text-2xl font-semibold">Latest alerts</h2>
            <div className="space-y-3">
              {stats.recentAlerts.map((a) => (
                <div key={a.id} className="rounded-card border border-surface-border bg-surface p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium text-text-primary">{a.title}</div>
                      <div className="mt-1 text-sm text-text-secondary">{a.body}</div>
                    </div>
                    <span
                      className={`rounded-pill px-2 py-0.5 text-xs ${
                        a.severity === "critical"
                          ? "bg-danger/20 text-danger"
                          : a.severity === "warning"
                          ? "bg-warning/20 text-warning"
                          : "bg-accent/10 text-accent-light"
                      }`}
                    >
                      {a.severity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!stats.ok && (
          <div className="mt-16 rounded-card border border-warning/30 bg-warning/5 p-5">
            <div className="font-medium text-warning">⚠ Setup pending</div>
            <div className="mt-1 text-sm text-text-secondary">
              Run <code className="rounded bg-chocolate-light/50 px-1.5 py-0.5 text-xs">supabase/schema.sql</code> and set env vars in Vercel. See <Link href="/settings" className="text-accent-light underline">Settings</Link>.
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}

function QuickAction({ href, title, body }: { href: string; title: string; body: string }) {
  return (
    <Link
      href={href}
      className="group block rounded-card border border-surface-border bg-surface p-5 transition-all hover:border-accent/40 hover:bg-surface-hover"
    >
      <div className="font-serif text-lg font-semibold text-text-primary">{title}</div>
      <div className="mt-1 text-sm text-text-secondary">{body}</div>
      <div className="mt-3 flex items-center gap-1 text-xs text-accent-light opacity-0 transition-opacity group-hover:opacity-100">
        Open <ArrowRight className="h-3 w-3" />
      </div>
    </Link>
  );
}
