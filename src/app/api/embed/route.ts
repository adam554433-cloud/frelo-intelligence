import { NextRequest, NextResponse } from "next/server";
import { runEmbeddingPipeline } from "@/lib/embedding-pipeline";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? 200);
  const minRelevance = Number(req.nextUrl.searchParams.get("min_relevance") ?? 4);
  try {
    const result = await runEmbeddingPipeline({ limit, minRelevance });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "unknown" }, { status: 500 });
  }
}
