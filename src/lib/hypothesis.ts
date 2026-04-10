import { supabaseAdmin } from "./supabase";
import { ask, extractJSON } from "./claude";
import { BRAND_CONTEXT } from "./brand";
import { searchItems } from "./rag";
import { generateQueries } from "./query-generator";

export interface HypothesisDecomposition {
  restated: string;
  sub_claims: string[];
  queries: { reddit: string[]; tiktok: string[]; youtube: string[]; trustpilot: string[] };
  counter_evidence_prompts: string[];
  success_criteria: string;
}

export async function decomposeHypothesis(statement: string): Promise<HypothesisDecomposition> {
  const raw = await ask({
    tier: "deep",
    maxTokens: 2500,
    temperature: 0.2,
    system: `You are a consumer research strategist for frelo. Given a hypothesis, decompose it into testable sub-claims and search queries that would prove or disprove it.

Return ONLY valid JSON:
{
  "restated": "the hypothesis in sharper language",
  "sub_claims": ["claim 1", "claim 2", "claim 3"],
  "queries": {
    "reddit": ["5 queries"],
    "tiktok": ["3 queries"],
    "youtube": ["3 queries"],
    "trustpilot": ["1-3 competitor domains"]
  },
  "counter_evidence_prompts": ["what to search for to disprove claim 1", "..."],
  "success_criteria": "what would make us say validated vs refuted"
}

${BRAND_CONTEXT}`,
    user: `Hypothesis: ${statement}`,
  });
  return extractJSON<HypothesisDecomposition>(raw);
}

export async function createHypothesis(statement: string): Promise<number> {
  const db = supabaseAdmin();
  const decomposition = await decomposeHypothesis(statement);

  const { data, error } = await db
    .from("intel_hypotheses")
    .insert({
      statement,
      sub_claims: decomposition.sub_claims,
      queries_generated: decomposition.queries,
      status: "open",
    })
    .select()
    .single();

  if (error || !data) throw new Error(error?.message ?? "create failed");
  return data.id as number;
}

export async function testHypothesis(hypothesisId: number): Promise<{
  supporting: number;
  refuting: number;
  verdict: string;
  confidence: number;
}> {
  const db = supabaseAdmin();

  const { data: hyp, error } = await db
    .from("intel_hypotheses")
    .select("*")
    .eq("id", hypothesisId)
    .single();

  if (error || !hyp) throw new Error("hypothesis not found");

  await db.from("intel_hypotheses").update({ status: "testing" }).eq("id", hypothesisId);

  // Semantic search for supporting evidence (the statement itself)
  const supporting = await searchItems(hyp.statement, { limit: 15, minSim: 0.55, minRelevance: 4 });

  // Semantic search for refuting evidence (inverted)
  const antiQuery = `evidence against: ${hyp.statement}`;
  const refuting = await searchItems(antiQuery, { limit: 15, minSim: 0.55, minRelevance: 4 });

  // Format evidence for LLM verdict
  const supText = supporting.map((s, i) => `[sup${i + 1}] ${s.content.slice(0, 500)}`).join("\n\n");
  const refText = refuting.map((r, i) => `[ref${i + 1}] ${r.content.slice(0, 500)}`).join("\n\n");

  const raw = await ask({
    tier: "deep",
    maxTokens: 2500,
    temperature: 0.2,
    system: `You are a rigorous research analyst. Given a hypothesis and two sets of evidence (supporting and refuting), deliver a verdict.

Return ONLY JSON:
{
  "verdict": "2-3 sentence summary",
  "status": "validated | refuted | inconclusive",
  "confidence": 0-100,
  "strongest_support": "quote the strongest supporting evidence with [supN]",
  "strongest_refutation": "quote the strongest refuting evidence with [refN]",
  "next_steps": "what research would resolve the uncertainty"
}

${BRAND_CONTEXT}`,
    user: `Hypothesis: ${hyp.statement}\n\nSub-claims: ${JSON.stringify(hyp.sub_claims)}\n\nSUPPORTING EVIDENCE:\n${supText || "(none)"}\n\nREFUTING EVIDENCE:\n${refText || "(none)"}`,
  });

  const verdict = extractJSON<{
    verdict: string;
    status: "validated" | "refuted" | "inconclusive";
    confidence: number;
    strongest_support: string;
    strongest_refutation: string;
    next_steps: string;
  }>(raw);

  await db
    .from("intel_hypotheses")
    .update({
      status: verdict.status,
      verdict: verdict.verdict,
      confidence_score: verdict.confidence,
      supporting_item_ids: supporting.map((s) => s.id),
      refuting_item_ids: refuting.map((r) => r.id),
      tested_at: new Date().toISOString(),
    })
    .eq("id", hypothesisId);

  return {
    supporting: supporting.length,
    refuting: refuting.length,
    verdict: verdict.verdict,
    confidence: verdict.confidence,
  };
}
