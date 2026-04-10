import { Shell } from "@/components/Shell";

const REQUIRED_ENV = [
  { key: "NEXT_PUBLIC_SUPABASE_URL", status: "✓ reused from creative-hub" },
  { key: "NEXT_PUBLIC_SUPABASE_ANON_KEY", status: "set in Vercel" },
  { key: "SUPABASE_SERVICE_ROLE_KEY", status: "set in Vercel" },
  { key: "ANTHROPIC_API_KEY", status: "✓ reused from creative-hub" },
  { key: "OPENAI_API_KEY", status: "needed for embeddings" },
  { key: "CRON_SECRET", status: "random string for cron auth" },
  { key: "KV_REST_API_URL", status: "optional — reuse from research-hub" },
  { key: "KV_REST_API_TOKEN", status: "optional — reuse from research-hub" },
];

export default function SettingsPage() {
  return (
    <Shell>
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-8">
          <div className="text-sm uppercase tracking-[0.2em] text-accent-light">settings</div>
          <h1 className="mt-2 font-serif text-4xl font-semibold">Configuration.</h1>
        </div>

        <div className="rounded-card border border-surface-border bg-surface p-6">
          <h2 className="font-serif text-xl font-semibold">Environment variables</h2>
          <p className="mt-1 text-sm text-text-secondary">Set these in Vercel → Project Settings → Environment Variables.</p>
          <ul className="mt-5 space-y-2">
            {REQUIRED_ENV.map((e) => (
              <li key={e.key} className="flex items-center justify-between rounded-card bg-chocolate-light/30 px-4 py-3">
                <code className="text-sm text-accent-light">{e.key}</code>
                <span className="text-xs text-text-muted">{e.status}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 rounded-card border border-surface-border bg-surface p-6">
          <h2 className="font-serif text-xl font-semibold">Database schema</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Run <code className="rounded bg-chocolate-light/50 px-1.5 py-0.5 text-xs">supabase/schema.sql</code> once in the
            Supabase SQL editor. All tables are prefixed <code className="text-accent-light">intel_</code> so they won&apos;t
            collide with the existing creative-hub tables.
          </p>
        </div>
      </div>
    </Shell>
  );
}
