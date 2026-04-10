import { Shell } from "@/components/Shell";

const REQUIRED_ENV = [
  { key: "NEXT_PUBLIC_SUPABASE_URL", status: "✓ reuse from creative-hub" },
  { key: "NEXT_PUBLIC_SUPABASE_ANON_KEY", status: "set in Vercel" },
  { key: "SUPABASE_SERVICE_ROLE_KEY", status: "set in Vercel (admin writes)" },
  { key: "ANTHROPIC_API_KEY", status: "✓ reuse from creative-hub" },
  { key: "OPENAI_API_KEY", status: "required — embeddings (text-embedding-3-small)" },
  { key: "CRON_SECRET", status: "random string for cron auth" },
];

const PIPELINE_STEPS = [
  { num: 1, label: "Ingest", endpoint: "/api/ingest/run?source=reddit", desc: "Scrape posts/comments/reviews into intel_items" },
  { num: 2, label: "Analyze", endpoint: "/api/analyze?limit=100", desc: "Batched Claude analysis + frelo-relevance scoring" },
  { num: 3, label: "Embed", endpoint: "/api/embed?limit=200", desc: "Embed high-relevance items into pgvector" },
  { num: 4, label: "Cluster", endpoint: "/api/cluster", desc: "Semantic clustering via cosine similarity" },
  { num: 5, label: "Synthesize", endpoint: "/api/synthesize?max=8", desc: "Generate avatars from clusters (Claude Opus)" },
  { num: 6, label: "Delta detect", endpoint: "/api/intel/delta", desc: "Find new themes vs 7-day baseline" },
];

export default function SettingsPage() {
  return (
    <Shell>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-10">
        <div className="mb-6 sm:mb-8">
          <div className="text-xs sm:text-sm uppercase tracking-[0.2em] text-accent-light">settings</div>
          <h1 className="mt-2 font-serif text-3xl sm:text-4xl font-semibold">Configuration & ops.</h1>
        </div>

        <div className="rounded-card border border-surface-border bg-surface p-4 sm:p-6">
          <h2 className="font-serif text-lg sm:text-xl font-semibold">1. Run database schema</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Open Supabase SQL editor, paste <code className="rounded bg-chocolate-light/50 px-1.5 py-0.5 text-xs">supabase/schema.sql</code>,
            and run it once. Safe to re-run — uses <code className="text-accent-light">if not exists</code>.
          </p>
        </div>

        <div className="mt-6 rounded-card border border-surface-border bg-surface p-4 sm:p-6">
          <h2 className="font-serif text-lg sm:text-xl font-semibold">2. Environment variables</h2>
          <p className="mt-1 text-sm text-text-secondary">Set in Vercel → Project Settings → Environment Variables.</p>
          <ul className="mt-5 space-y-2">
            {REQUIRED_ENV.map((e) => (
              <li key={e.key} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 rounded-card bg-chocolate-light/30 px-4 py-3">
                <code className="text-xs sm:text-sm text-accent-light break-all">{e.key}</code>
                <span className="text-xs text-text-muted">{e.status}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 rounded-card border border-surface-border bg-surface p-4 sm:p-6">
          <h2 className="font-serif text-lg sm:text-xl font-semibold">3. Pipeline (run in order)</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Hit each endpoint manually first time, or wait for the cron schedule.
          </p>
          <ol className="mt-5 space-y-3">
            {PIPELINE_STEPS.map((s) => (
              <li key={s.num} className="rounded-card bg-chocolate-light/30 p-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-pill bg-accent/20 text-xs text-accent-light">
                    {s.num}
                  </span>
                  <span className="font-medium text-text-primary">{s.label}</span>
                </div>
                <code className="mt-1 block text-xs text-accent-light">{s.endpoint}</code>
                <p className="mt-1 text-xs text-text-secondary">{s.desc}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-6 rounded-card border border-surface-border bg-surface p-4 sm:p-6">
          <h2 className="font-serif text-lg sm:text-xl font-semibold">4. Cron schedule (auto)</h2>
          <ul className="mt-3 space-y-1 text-sm text-text-secondary">
            <li>• Reddit ingest every 6h</li>
            <li>• TikTok ingest every 6h (offset 30min)</li>
            <li>• Trustpilot ingest daily at 04:00 UTC</li>
            <li>• Delta detector daily at 06:00 UTC</li>
          </ul>
          <p className="mt-3 text-xs text-text-muted">
            Set in <code className="text-accent-light">vercel.json</code>. Analyzer/embed/cluster/synthesize currently run manually — chain them next iteration.
          </p>
        </div>
      </div>
    </Shell>
  );
}
