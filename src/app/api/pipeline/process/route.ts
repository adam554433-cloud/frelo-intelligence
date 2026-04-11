import { NextRequest, NextResponse } from "next/server";
import { runAnalyzer } from "@/lib/analyzer";
import { runEmbeddingPipeline } from "@/lib/embedding-pipeline";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Lightweight daily pipeline: just analyze + embed chunks.
 * Clustering + synthesis are manually triggered from /api/synthesize
 * to avoid timeouts and give user control over avatar count.
 *
 * This endpoint is safe to call repeatedly — each call processes
 * one chunk (100 items analyzed, 200 embedded).
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const provided = req.nextUrl.searchParams.get("secret") ?? req.headers.get("authorization")?.replace("Bearer ", "");
    if (provided !== secret) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const stages: Record<string, unknown> = {};

  try {
    stages.analyze = await runAnalyzer({ limit: 100 });
  } catch (err) {
    stages.analyze = { error: err instanceof Error ? err.message : "unknown" };
  }

  try {
    stages.embed = await runEmbeddingPipeline({ limit: 200, minRelevance: 4 });
  } catch (err) {
    stages.embed = { error: err instanceof Error ? err.message : "unknown" };
  }

  return NextResponse.json({ ok: true, stages });
}
