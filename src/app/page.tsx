import Link from "next/link";
import { Shell } from "@/components/Shell";
import { StatCard } from "@/components/StatCard";
import { ArrowRight, Sparkles } from "lucide-react";

export default function DashboardPage() {
  return (
    <Shell>
      <div className="mx-auto max-w-6xl px-6 py-10 sm:py-14">
        {/* Header */}
        <div className="mb-10">
          <div className="mb-3 flex items-center gap-2 text-sm text-accent-light">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-light animate-pulse-slow" />
            <span className="uppercase tracking-[0.2em]">brand brain · live</span>
          </div>
          <h1 className="font-serif text-4xl font-semibold leading-tight sm:text-5xl">
            What do you want to{" "}
            <span className="bg-brand-gradient bg-clip-text text-transparent">know</span>?
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-text-secondary">
            A living intelligence engine for frelo. Test hypotheses, discover avatars, track competitors — all grounded in real consumer voice.
          </p>
        </div>

        {/* Ask Anything hero card */}
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
                "Why are women 45-60 underserved in creatine?"
              </div>
              <div className="mt-2 text-sm text-text-secondary">
                Chat with your brand's collective intelligence. Every answer cited to real sources.
              </div>
            </div>
            <ArrowRight className="h-6 w-6 text-text-muted transition-all group-hover:translate-x-1 group-hover:text-accent-light" />
          </div>
        </Link>

        {/* Stats */}
        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Items ingested" value="0" hint="across all platforms" icon="Database" />
          <StatCard label="Avatars discovered" value="0" hint="grounded in data" icon="Users" accent />
          <StatCard label="Hypotheses" value="0" hint="open · testing" icon="FlaskConical" />
          <StatCard label="Alerts" value="0" hint="unread" icon="Bell" />
        </div>

        {/* Quick actions */}
        <div className="grid gap-4 sm:grid-cols-3">
          <QuickAction
            href="/hypotheses"
            title="Test a hypothesis"
            body="Write what you believe. The engine finds proof or disproof."
          />
          <QuickAction
            href="/avatars"
            title="Explore avatars"
            body="Audiences discovered from the voice of real consumers."
          />
          <QuickAction
            href="/competitors"
            title="War-game competitors"
            body="What Create Wellness customers complain about today."
          />
        </div>

        {/* Status */}
        <div className="mt-16 rounded-card border border-surface-border bg-surface p-5">
          <div className="flex items-start gap-3">
            <div className="mt-1 h-2 w-2 rounded-full bg-warning" />
            <div className="flex-1">
              <div className="font-medium text-text-primary">Intelligence Engine · Phase 1 Foundation</div>
              <div className="mt-1 text-sm text-text-secondary">
                Scaffold deployed. Next: set Supabase secrets in Vercel, run{" "}
                <code className="rounded bg-chocolate-light/50 px-1.5 py-0.5 text-xs">supabase/schema.sql</code>, and wire Day 2 ingestion workers.
              </div>
            </div>
          </div>
        </div>
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
