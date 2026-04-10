import { NextRequest, NextResponse } from "next/server";
import { ask } from "@/lib/claude";
import { BRAND_CONTEXT } from "@/lib/brand";

export const runtime = "nodejs";
export const maxDuration = 60;

// Day 1: basic grounded Q&A against brand context only.
// Day 2+: add semantic search over intel_items for true RAG.
export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "message required" }, { status: 400 });
    }

    const answer = await ask({
      tier: "deep",
      maxTokens: 2000,
      temperature: 0.4,
      system: `You are frelo's Intelligence Engine — a CMO-level strategist who only cites real evidence.
Today you have access to the frelo brand context below. In Day 2 you will also get access to a live semantic search index of scraped consumer voice data.

When the user asks something that depends on consumer data that isn't yet ingested, say so honestly: "No evidence yet — ingestion starts Day 2. Based on brand context only: ..."

Be direct, specific, and unpretentious. Never invent quotes or stats.

${BRAND_CONTEXT}`,
      user: message,
    });

    return NextResponse.json({
      answer,
      citations: [],
      note: "Day 1: grounded in brand context only. Full RAG over scraped data comes Day 2.",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
