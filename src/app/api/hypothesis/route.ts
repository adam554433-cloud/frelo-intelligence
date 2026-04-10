import { NextRequest, NextResponse } from "next/server";
import { ask, extractJSON } from "@/lib/claude";
import { BRAND_CONTEXT } from "@/lib/brand";

export const runtime = "nodejs";
export const maxDuration = 60;

// Day 1: decomposes a hypothesis into testable sub-claims + search queries.
// Day 2: persists to intel_hypotheses and triggers ingestion workers.
export async function POST(req: NextRequest) {
  try {
    const { statement } = await req.json();
    if (!statement || typeof statement !== "string") {
      return NextResponse.json({ error: "statement required" }, { status: 400 });
    }

    const raw = await ask({
      tier: "deep",
      maxTokens: 2500,
      temperature: 0.2,
      system: `You are a consumer research strategist for frelo. Given a hypothesis, decompose it into testable sub-claims and search queries that would prove or disprove it across Reddit, TikTok, Amazon reviews, and Trustpilot.

Return ONLY valid JSON (no markdown) in this format:
{
  "restated": "the hypothesis in sharper language",
  "sub_claims": ["claim 1 that must be true", "claim 2", "claim 3"],
  "queries": {
    "reddit": ["query 1", "query 2", "query 3", "query 4", "query 5"],
    "tiktok": ["query 1", "query 2", "query 3"],
    "amazon": ["query 1 for competitor reviews", "query 2"],
    "trustpilot": ["query 1"]
  },
  "counter_evidence_prompts": ["what to search for to disprove claim 1", "to disprove claim 2"],
  "success_criteria": "what would make us say this is validated vs refuted"
}

${BRAND_CONTEXT}`,
      user: `Hypothesis: ${statement}`,
    });

    const parsed = extractJSON(raw);
    return NextResponse.json(parsed);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
