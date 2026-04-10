"use client";

import { useEffect, useState } from "react";
import { Shell } from "@/components/Shell";
import { FlaskConical, Loader2, Play } from "lucide-react";

interface Hypothesis {
  id: number;
  statement: string;
  status: "open" | "testing" | "validated" | "refuted" | "inconclusive";
  sub_claims: string[];
  confidence_score: number | null;
  verdict: string | null;
  created_at: string;
}

const statusStyles: Record<string, string> = {
  open: "bg-text-muted/20 text-text-secondary",
  testing: "bg-warning/20 text-warning",
  validated: "bg-success/20 text-success",
  refuted: "bg-danger/20 text-danger",
  inconclusive: "bg-accent/20 text-accent-light",
};

export default function HypothesesPage() {
  const [list, setList] = useState<Hypothesis[]>([]);
  const [statement, setStatement] = useState("");
  const [loading, setLoading] = useState(false);
  const [testingId, setTestingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      const res = await fetch("/api/hypothesis");
      const data = await res.json();
      setList(data.hypotheses ?? []);
    } catch {}
  }

  useEffect(() => {
    refresh();
  }, []);

  async function create() {
    if (!statement.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/hypothesis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statement, persist: true }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setStatement("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function test(id: number) {
    if (testingId) return;
    setTestingId(id);
    try {
      await fetch("/api/hypothesis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hypothesis_id: id, action: "test" }),
      });
      await refresh();
    } catch {}
    setTestingId(null);
  }

  return (
    <Shell>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-10">
        <div className="mb-4 sm:mb-6 flex items-center gap-2 text-xs sm:text-sm text-accent-light">
          <FlaskConical className="h-4 w-4" />
          <span className="uppercase tracking-[0.2em]">hypothesis engine</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold">What do you believe?</h1>
        <p className="mt-2 text-text-secondary">
          State an assumption. The engine decomposes it, generates search queries, and ultimately validates or refutes it
          against real evidence.
        </p>

        <div className="mt-6 sm:mt-8">
          <textarea
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
            placeholder="e.g. Women 45-60 are underserved in creatine because all branding is gym-bro"
            rows={3}
            className="w-full rounded-card border border-surface-border bg-surface px-4 sm:px-5 py-3 sm:py-4 text-base text-text-primary placeholder:text-text-muted focus:border-accent/40 focus:outline-none"
          />
          <button
            onClick={create}
            disabled={loading || !statement.trim()}
            className="mt-3 flex w-full sm:w-auto items-center justify-center gap-2 rounded-card bg-accent-gradient px-6 py-3 font-medium text-chocolate transition-opacity disabled:opacity-40 active:opacity-80"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />}
            Create hypothesis
          </button>
        </div>

        {error && (
          <div className="mt-6 rounded-card border border-danger/30 bg-danger/10 p-4 text-danger">{error}</div>
        )}

        <div className="mt-10 space-y-4">
          {list.length === 0 ? (
            <div className="rounded-card border border-dashed border-surface-border p-8 text-center text-text-muted">
              No hypotheses yet. Write one above.
            </div>
          ) : (
            list.map((h) => (
              <div key={h.id} className="rounded-card border border-surface-border bg-surface p-4 sm:p-5">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <p className="flex-1 min-w-0 font-serif text-base sm:text-lg text-text-primary break-words">{h.statement}</p>
                  <span className={`shrink-0 rounded-pill px-2 sm:px-3 py-1 text-[10px] sm:text-xs uppercase ${statusStyles[h.status]}`}>
                    {h.status}
                  </span>
                </div>

                {h.sub_claims && h.sub_claims.length > 0 && (
                  <div className="mt-3">
                    <div className="text-xs uppercase tracking-wider text-text-muted">Sub-claims</div>
                    <ol className="mt-1 space-y-1 text-sm text-text-secondary">
                      {h.sub_claims.map((c, i) => (
                        <li key={i}>
                          {i + 1}. {c}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {h.verdict && (
                  <div className="mt-3 rounded-card bg-chocolate-light/30 p-3">
                    <div className="text-xs uppercase tracking-wider text-accent-light">
                      Verdict · confidence {h.confidence_score ?? "?"}%
                    </div>
                    <p className="mt-1 text-sm text-text-primary">{h.verdict}</p>
                  </div>
                )}

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-text-muted">
                    {new Date(h.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                  <button
                    onClick={() => test(h.id)}
                    disabled={testingId === h.id || h.status === "testing"}
                    className="flex items-center gap-1 rounded-pill border border-accent/30 px-3 py-1 text-xs text-accent-light transition-colors hover:bg-accent/10 disabled:opacity-40"
                  >
                    {testingId === h.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                    {h.status === "open" ? "Test now" : "Re-test"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Shell>
  );
}
