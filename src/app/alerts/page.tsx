import { Shell } from "@/components/Shell";
import { EmptyState } from "@/components/EmptyState";
import { supabaseAdmin } from "@/lib/supabase";

export const revalidate = 0;
export const dynamic = "force-dynamic";

async function getAlerts() {
  try {
    const db = supabaseAdmin();
    const { data } = await db.from("intel_alerts").select("*").order("created_at", { ascending: false }).limit(100);
    return data ?? [];
  } catch {
    return [];
  }
}

const severityStyles: Record<string, string> = {
  critical: "border-danger/50 bg-danger/5",
  warning: "border-warning/50 bg-warning/5",
  info: "border-accent/30 bg-accent/5",
};

export default async function AlertsPage() {
  const alerts = await getAlerts();

  return (
    <Shell>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-10">
        <div className="mb-6 sm:mb-8">
          <div className="text-xs sm:text-sm uppercase tracking-[0.2em] text-accent-light">alerts</div>
          <h1 className="mt-2 font-serif text-3xl sm:text-4xl font-semibold">What changed in the last 24h.</h1>
        </div>

        {alerts.length === 0 ? (
          <EmptyState
            icon="Bell"
            title="No alerts yet."
            body="Delta detection runs daily at 06:00 UTC. New themes, competitor complaint spikes, and narrative shifts will appear here."
          />
        ) : (
          <div className="space-y-3">
            {alerts.map((a) => (
              <div key={a.id} className={`rounded-card border p-4 sm:p-5 ${severityStyles[a.severity] ?? severityStyles.info}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-serif text-base sm:text-lg font-semibold text-text-primary">{a.title}</div>
                    {a.body && <p className="mt-1 text-sm text-text-secondary">{a.body}</p>}
                    <div className="mt-2 text-xs text-text-muted">
                      {new Date(a.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })} · {a.kind}
                    </div>
                  </div>
                  <span className="shrink-0 rounded-pill bg-chocolate-light/40 px-2 py-0.5 text-[10px] sm:text-xs uppercase text-text-muted">{a.severity}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}
