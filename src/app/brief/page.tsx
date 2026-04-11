"use client";

import { useState } from "react";
import { Shell } from "@/components/Shell";
import { Briefcase, Loader2 } from "lucide-react";

interface StrategicBriefT {
  title: string;
  executive_summary: string;
  narrative_shift: { from: string; to: string; evidence: string; confidence: number };
  positioning_recommendation: string;
  target_avatars: Array<{ id: number; name: string; why: string }>;
  top_3_hooks: string[];
  competitive_intelligence: { biggest_gap_to_exploit: string; biggest_threat: string; defensive_move: string };
  budget_allocation: { awareness: number; conversion: number; defensive: number; rationale: string };
  hypotheses_to_validate: string[];
  risks: string[];
  kpis: string[];
  next_30_days: string[];
}

export default function BriefPage() {
  const [focus, setFocus] = useState("");
  const [loading, setLoading] = useState(false);
  const [brief, setBrief] = useState<StrategicBriefT | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/intel/strategic-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ focus, horizon: "this_quarter" }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setBrief(data.brief);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Shell>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-10">
        <div className="mb-6 flex items-center gap-2 text-xs sm:text-sm text-accent-light">
          <Briefcase className="h-4 w-4" />
          <span className="uppercase tracking-[0.2em]">strategic brief</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold">CMO-level recommendation.</h1>
        <p className="mt-2 text-text-secondary">
          Claude Opus synthesizes every avatar, alert, hypothesis, and signal into a single C-suite briefing.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            placeholder="Optional: focus area (e.g. 'Q3 launch' or 'defense against Create Wellness')"
            className="flex-1 rounded-card border border-surface-border bg-surface px-5 py-3 text-base text-text-primary placeholder:text-text-muted focus:border-accent/40 focus:outline-none"
          />
          <button
            onClick={run}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-card bg-accent-gradient px-6 py-3 font-medium text-chocolate disabled:opacity-40 active:opacity-80"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Briefcase className="h-4 w-4" />}
            Generate brief
          </button>
        </div>

        {error && <div className="mt-6 rounded-card border border-danger/30 bg-danger/10 p-4 text-danger">{error}</div>}

        {brief && (
          <div className="mt-8 space-y-5">
            <div className="rounded-card border border-accent/30 bg-accent/5 p-6">
              <div className="text-xs uppercase tracking-wider text-accent-light">title</div>
              <h2 className="mt-1 font-serif text-2xl sm:text-3xl font-semibold">{brief.title}</h2>
              <p className="mt-4 text-text-primary">{brief.executive_summary}</p>
            </div>

            <Section title="Narrative shift">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-card bg-danger/10 border border-danger/20 p-4">
                  <div className="text-xs uppercase tracking-wider text-danger">from</div>
                  <div className="mt-1 text-text-primary">{brief.narrative_shift.from}</div>
                </div>
                <div className="rounded-card bg-success/10 border border-success/20 p-4">
                  <div className="text-xs uppercase tracking-wider text-success">to</div>
                  <div className="mt-1 text-text-primary">{brief.narrative_shift.to}</div>
                </div>
              </div>
              <div className="mt-3 text-sm text-text-secondary italic">{brief.narrative_shift.evidence}</div>
              <div className="mt-2 text-xs text-text-muted">Confidence: {brief.narrative_shift.confidence}%</div>
            </Section>

            <Section title="Positioning">
              <p className="text-text-primary">{brief.positioning_recommendation}</p>
            </Section>

            <Section title={`Target avatars (${brief.target_avatars.length})`}>
              <div className="space-y-2">
                {brief.target_avatars.map((a) => (
                  <a
                    key={a.id}
                    href={`/avatars/${a.id}`}
                    className="block rounded-card bg-chocolate-light/30 p-3 transition-colors hover:bg-chocolate-light/50"
                  >
                    <div className="font-medium text-accent-light">{a.name}</div>
                    <div className="text-sm text-text-secondary">{a.why}</div>
                  </a>
                ))}
              </div>
            </Section>

            <Section title="Top 3 hooks">
              <ol className="space-y-2">
                {brief.top_3_hooks.map((h, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="text-accent-light">{i + 1}.</span>
                    <span className="text-text-primary">{h}</span>
                  </li>
                ))}
              </ol>
            </Section>

            <Section title="Competitive intelligence">
              <div className="space-y-3">
                <div>
                  <div className="text-xs uppercase tracking-wider text-success">gap to exploit</div>
                  <div className="mt-1 text-text-primary">{brief.competitive_intelligence.biggest_gap_to_exploit}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-danger">biggest threat</div>
                  <div className="mt-1 text-text-primary">{brief.competitive_intelligence.biggest_threat}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-accent-light">defensive move</div>
                  <div className="mt-1 text-text-primary">{brief.competitive_intelligence.defensive_move}</div>
                </div>
              </div>
            </Section>

            <Section title="Budget allocation">
              <div className="grid grid-cols-3 gap-2">
                <Box label="Awareness" value={`${brief.budget_allocation.awareness}%`} />
                <Box label="Conversion" value={`${brief.budget_allocation.conversion}%`} />
                <Box label="Defensive" value={`${brief.budget_allocation.defensive}%`} />
              </div>
              <p className="mt-3 text-sm text-text-secondary">{brief.budget_allocation.rationale}</p>
            </Section>

            <Section title="Hypotheses to validate">
              <ul className="space-y-1">
                {brief.hypotheses_to_validate.map((h, i) => (
                  <li key={i} className="text-text-primary">— {h}</li>
                ))}
              </ul>
            </Section>

            <Section title="Risks">
              <ul className="space-y-1">
                {brief.risks.map((r, i) => (
                  <li key={i} className="text-danger">⚠ {r}</li>
                ))}
              </ul>
            </Section>

            <Section title="KPIs to track">
              <ul className="space-y-1">
                {brief.kpis.map((k, i) => (
                  <li key={i} className="text-text-primary">— {k}</li>
                ))}
              </ul>
            </Section>

            <Section title="Next 30 days">
              <ol className="space-y-2">
                {brief.next_30_days.map((a, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-pill bg-accent/20 text-xs text-accent-light">
                      {i + 1}
                    </span>
                    <span className="text-text-primary">{a}</span>
                  </li>
                ))}
              </ol>
            </Section>
          </div>
        )}
      </div>
    </Shell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-card border border-surface-border bg-surface p-5">
      <div className="mb-3 text-xs uppercase tracking-wider text-accent-light">{title}</div>
      {children}
    </div>
  );
}

function Box({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-card bg-chocolate-light/30 p-3 text-center">
      <div className="text-xs uppercase tracking-wider text-text-muted">{label}</div>
      <div className="mt-1 font-serif text-2xl font-semibold text-accent-light">{value}</div>
    </div>
  );
}
