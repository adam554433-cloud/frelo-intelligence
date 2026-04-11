import { NextRequest, NextResponse } from "next/server";
import { runAnalyzer } from "@/lib/analyzer";
import { runEmbeddingPipeline } from "@/lib/embedding-pipeline";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

/**
 * Drain pipeline: analyze + embed until time runs out or queue is empty.
 * Processes items in rolling chunks to maximize throughput per invocation.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const provided = req.nextUrl.searchParams.get("secret") ?? req.headers.get("authorization")?.replace("Bearer ", "");
    if (provided !== secret) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const start = Date.now();
  const budget = 280_000; // leave 20s safety margin
  const hasTime = () => Date.now() - start < budget;

  const db = supabaseAdmin();
  const totals = { analyze_rounds: 0, analyzed: 0, kept: 0, embed_rounds: 0, embedded: 0 };

  // Keep analyzing while there's time and work
  while (hasTime()) {
    const { count: unanalyzed } = await db
      .from("intel_items")
      .select("*", { count: "exact", head: true })
      .is("analyzed_at", null);

    if (!unanalyzed || unanalyzed === 0) break;

    try {
      const r = await runAnalyzer({ limit: 50 });
      totals.analyze_rounds++;
      totals.analyzed += r.analyzed;
      totals.kept += r.kept;
      if (r.analyzed === 0) break;
    } catch (err) {
      console.error("drain analyze error:", err);
      break;
    }
  }

  // Embed whatever we can in the remaining time
  while (hasTime()) {
    const { count: unembedded } = await db
      .from("intel_items")
      .select("*", { count: "exact", head: true })
      .is("embedded_at", null)
      .not("analyzed_at", "is", null)
      .gte("frelo_relevance", 4);

    if (!unembedded || unembedded === 0) break;

    try {
      const r = await runEmbeddingPipeline({ limit: 64, minRelevance: 4 });
      totals.embed_rounds++;
      totals.embedded += r.embedded;
      if (r.embedded === 0) break;
    } catch (err) {
      console.error("drain embed error:", err);
      break;
    }
  }

  const elapsed = Date.now() - start;
  await db.from("intel_events").insert({
    kind: "pipeline_drained",
    payload: { ...totals, elapsed_ms: elapsed },
  });

  return NextResponse.json({ ok: true, elapsed_ms: elapsed, ...totals });
}
