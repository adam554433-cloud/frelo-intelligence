"use client";

import { useState } from "react";
import { Shell } from "@/components/Shell";
import { FlaskConical, Loader2 } from "lucide-react";

interface Decomposition {
  restated: string;
  sub_claims: string[];
  queries: Record<string, string[]>;
  counter_evidence_prompts: string[];
  success_criteria: string;
}

export default function HypothesesPage() {
  const [statement, setStatement] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Decomposition | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!statement.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/hypothesis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statement }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Shell>
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-6 flex items-center gap-2 text-sm text-accent-light">
          <FlaskConical className="h-4 w-4" />
          <span className="uppercase tracking-[0.2em]">hypothesis engine</span>
        </div>
        <h1 className="font-serif text-4xl font-semibold">What do you believe?</h1>
        <p className="mt-2 text-text-secondary">
          State an assumption. We&apos;ll decompose it into testable sub-claims and generate queries to prove or disprove it.
        </p>

        <div className="mt-8">
          <textarea
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
            placeholder="e.g. Women 45-60 are underserved in creatine because all branding is gym-bro"
            rows={3}
            className="w-full rounded-card border border-surface-border bg-surface px-5 py-4 text-text-primary placeholder:text-text-muted focus:border-accent/40 focus:outline-none"
          />
          <button
            onClick={submit}
            disabled={loading || !statement.trim()}
            className="mt-3 flex items-center gap-2 rounded-card bg-accent-gradient px-6 py-3 font-medium text-chocolate transition-opacity disabled:opacity-40"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />}
            Decompose & plan tests
          </button>
        </div>

        {error && (
          <div className="mt-6 rounded-card border border-danger/30 bg-danger/10 p-4 text-danger">{error}</div>
        )}

        {result && (
          <div className="mt-10 space-y-6">
            <Section title="Restated">
              <p className="text-text-primary">{result.restated}</p>
            </Section>

            <Section title={`Sub-claims (${result.sub_claims.length})`}>
              <ol className="space-y-2">
                {result.sub_claims.map((c, i) => (
                  <li key={i} className="flex gap-3 text-text-primary">
                    <span className="text-accent-light">{i + 1}.</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ol>
            </Section>

            <Section title="Search queries">
              <div className="space-y-4">
                {Object.entries(result.queries).map(([platform, queries]) => (
                  <div key={platform}>
                    <div className="mb-2 text-xs uppercase tracking-wider text-accent-light">{platform}</div>
                    <div className="flex flex-wrap gap-2">
                      {queries.map((q, i) => (
                        <span
                          key={i}
                          className="rounded-pill border border-surface-border bg-chocolate-light/40 px-3 py-1 text-xs text-text-secondary"
                        >
                          {q}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Counter-evidence">
              <ul className="space-y-2">
                {result.counter_evidence_prompts.map((p, i) => (
                  <li key={i} className="text-text-secondary">
                    — {p}
                  </li>
                ))}
              </ul>
            </Section>

            <Section title="Success criteria">
              <p className="text-text-primary">{result.success_criteria}</p>
            </Section>

            <div className="rounded-card border border-dashed border-surface-border bg-surface/40 p-5 text-sm text-text-muted">
              <strong className="text-text-secondary">Day 2:</strong> These queries will auto-run against
              Reddit/TikTok/Amazon/Trustpilot and return evidence items with cross-platform validation scores.
            </div>
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
