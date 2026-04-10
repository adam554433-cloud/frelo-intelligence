"use client";

import { useState } from "react";
import { Shell } from "@/components/Shell";
import { Loader2, Theater, Swords } from "lucide-react";

interface Reaction {
  avatar_id: number;
  avatar_name: string;
  verdict: "click" | "scroll" | "ignore" | "eye_roll";
  score: number;
  reaction: string;
  would_buy: "yes" | "maybe" | "no";
  objection: string | null;
}

interface RedTeamResult {
  hidden_assumptions: string[];
  counter_arguments: string[];
  evidence_gaps: string[];
  risk_level: "low" | "medium" | "high";
  refined_claim: string;
}

const verdictColors: Record<string, string> = {
  click: "text-success",
  scroll: "text-warning",
  ignore: "text-text-muted",
  eye_roll: "text-danger",
};

const verdictEmoji: Record<string, string> = {
  click: "🟢",
  scroll: "🟡",
  ignore: "⚫",
  eye_roll: "🔴",
};

export default function SimulatePage() {
  const [mode, setMode] = useState<"persona" | "red_team">("persona");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [reactions, setReactions] = useState<Reaction[] | null>(null);
  const [redTeam, setRedTeam] = useState<RedTeamResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (!input.trim() || loading) return;
    setLoading(true);
    setError(null);
    setReactions(null);
    setRedTeam(null);
    try {
      const body = mode === "persona" ? { ad_copy: input } : { mode: "red_team", claim: input };
      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (mode === "persona") setReactions(data.reactions);
      else setRedTeam(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Shell>
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-8">
          <div className="text-sm uppercase tracking-[0.2em] text-accent-light">
            {mode === "persona" ? "persona simulator" : "red team"}
          </div>
          <h1 className="mt-2 font-serif text-4xl font-semibold">
            {mode === "persona" ? "Test ads before you ship." : "Destroy your assumptions."}
          </h1>
          <p className="mt-2 text-text-secondary">
            {mode === "persona"
              ? "Synthetic personas (grounded in real scraped data) react to your copy as the actual audience would."
              : "Claude Opus tears apart any brand claim. Find the hidden assumptions before the market does."}
          </p>
        </div>

        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setMode("persona")}
            className={`flex items-center gap-2 rounded-pill border px-4 py-2 text-sm ${
              mode === "persona" ? "border-accent bg-accent/15 text-accent-light" : "border-surface-border text-text-secondary"
            }`}
          >
            <Theater className="h-4 w-4" /> Persona simulator
          </button>
          <button
            onClick={() => setMode("red_team")}
            className={`flex items-center gap-2 rounded-pill border px-4 py-2 text-sm ${
              mode === "red_team" ? "border-accent bg-accent/15 text-accent-light" : "border-surface-border text-text-secondary"
            }`}
          >
            <Swords className="h-4 w-4" /> Red team
          </button>
        </div>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={4}
          placeholder={
            mode === "persona"
              ? "Paste your ad copy here — hook, headline, or full script..."
              : "e.g. frelo is the best creatine for women over 50"
          }
          className="w-full rounded-card border border-surface-border bg-surface px-5 py-4 text-text-primary placeholder:text-text-muted focus:border-accent/40 focus:outline-none"
        />
        <button
          onClick={run}
          disabled={loading || !input.trim()}
          className="mt-3 flex items-center gap-2 rounded-card bg-accent-gradient px-6 py-3 font-medium text-chocolate transition-opacity disabled:opacity-40"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "persona" ? <Theater className="h-4 w-4" /> : <Swords className="h-4 w-4" />}
          {mode === "persona" ? "Run simulation" : "Red-team this"}
        </button>

        {error && <div className="mt-6 rounded-card border border-danger/30 bg-danger/10 p-4 text-danger">{error}</div>}

        {reactions && (
          <div className="mt-8 space-y-4">
            {reactions.length === 0 ? (
              <div className="rounded-card border border-surface-border bg-surface p-5 text-text-secondary">
                No avatars in the database yet. Run avatar synthesis first.
              </div>
            ) : (
              reactions.map((r) => (
                <div key={r.avatar_id} className="rounded-card border border-surface-border bg-surface p-5">
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <div className="font-serif text-lg font-semibold text-text-primary">{r.avatar_name}</div>
                      <div className={`text-sm ${verdictColors[r.verdict]}`}>
                        {verdictEmoji[r.verdict]} {r.verdict.replace("_", " ")} · score {r.score}/10
                      </div>
                    </div>
                    <span className={`rounded-pill px-3 py-1 text-xs ${r.would_buy === "yes" ? "bg-success/20 text-success" : r.would_buy === "maybe" ? "bg-warning/20 text-warning" : "bg-danger/20 text-danger"}`}>
                      buy: {r.would_buy}
                    </span>
                  </div>
                  <p className="mt-3 italic text-text-secondary">&ldquo;{r.reaction}&rdquo;</p>
                  {r.objection && <div className="mt-2 text-sm text-danger">Objection: {r.objection}</div>}
                </div>
              ))
            )}
          </div>
        )}

        {redTeam && (
          <div className="mt-8 space-y-4">
            <div className="rounded-card border border-surface-border bg-surface p-5">
              <div className="mb-2 text-xs uppercase tracking-wider text-accent-light">Risk level</div>
              <div className={`font-serif text-2xl ${redTeam.risk_level === "high" ? "text-danger" : redTeam.risk_level === "medium" ? "text-warning" : "text-success"}`}>
                {redTeam.risk_level.toUpperCase()}
              </div>
            </div>

            <RtSection title="Hidden assumptions" items={redTeam.hidden_assumptions} />
            <RtSection title="Counter-arguments" items={redTeam.counter_arguments} />
            <RtSection title="Evidence gaps" items={redTeam.evidence_gaps} />

            <div className="rounded-card border border-accent/40 bg-accent/5 p-5">
              <div className="mb-2 text-xs uppercase tracking-wider text-accent-light">Refined claim</div>
              <p className="text-text-primary">{redTeam.refined_claim}</p>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}

function RtSection({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-card border border-surface-border bg-surface p-5">
      <div className="mb-3 text-xs uppercase tracking-wider text-accent-light">{title}</div>
      <ul className="space-y-2">
        {items.map((it, i) => (
          <li key={i} className="text-text-secondary">
            — {it}
          </li>
        ))}
      </ul>
    </div>
  );
}
