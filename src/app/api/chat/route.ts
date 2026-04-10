import { NextRequest, NextResponse } from "next/server";
import { ask } from "@/lib/claude";
import { BRAND_CONTEXT } from "@/lib/brand";
import { searchItems, formatCitations } from "@/lib/rag";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "message required" }, { status: 400 });
    }

    // Semantic search for grounding (Voyage similarities run 0.4-0.7 range)
    let citations: Awaited<ReturnType<typeof searchItems>> = [];
    let searchError: string | null = null;
    try {
      citations = await searchItems(message, { limit: 12, minSim: 0.4, minRelevance: 4 });
    } catch (err) {
      searchError = err instanceof Error ? err.message : "unknown";
      console.error("[chat] searchItems threw:", searchError);
    }
    const evidenceBlock = formatCitations(citations);

    const answer = await ask({
      tier: "deep",
      maxTokens: 2500,
      temperature: 0.4,
      system: `You are frelo's Intelligence Engine — a CMO-level strategist. You have two sources of truth:
1. The frelo brand context (positioning, benefits, compliance, voice)
2. Real consumer voice data from Reddit, TikTok, YouTube, Trustpilot — scraped and analyzed for frelo relevance

You MUST cite evidence using [src1], [src2], etc. when making claims about what consumers think, feel, or say. Never invent quotes. If no evidence exists for a claim, say so.

Be direct, specific, unpretentious. No filler. No hype.

BRAND CONTEXT:
${BRAND_CONTEXT}

EVIDENCE FROM INTEL DATABASE:
${evidenceBlock}`,
      user: message,
    });

    return NextResponse.json({
      answer,
      citations,
      evidence_count: citations.length,
      debug_search_error: searchError,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
