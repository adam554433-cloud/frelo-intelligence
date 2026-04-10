import { NextRequest, NextResponse } from "next/server";
import { runAnalyzer } from "@/lib/analyzer";
import { runEmbeddingPipeline } from "@/lib/embedding-pipeline";
import { runClustering } from "@/lib/clustering";
import { synthesizeAllAvatars } from "@/lib/avatar-synth";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Orchestrator: runs analyze → embed → cluster → synthesize in one request.
 * Called daily at 05:00 UTC by Vercel Cron, after overnight ingestion.
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

  try {
    stages.cluster = await runClustering({ threshold: 0.7, minSize: 3 });
  } catch (err) {
    stages.cluster = { error: err instanceof Error ? err.message : "unknown" };
  }

  try {
    stages.synthesize = await synthesizeAllAvatars({ maxClusters: 6 });
  } catch (err) {
    stages.synthesize = { error: err instanceof Error ? err.message : "unknown" };
  }

  return NextResponse.json({ ok: true, stages });
}
