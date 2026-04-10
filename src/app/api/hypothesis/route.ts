import { NextRequest, NextResponse } from "next/server";
import { createHypothesis, decomposeHypothesis, testHypothesis } from "@/lib/hypothesis";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const maxDuration = 120;

// POST with { statement } → decompose (preview) and optionally persist
// POST with { statement, persist: true } → persist to DB, return hypothesis id
// POST with { hypothesis_id, action: "test" } → run test, return verdict
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Test an existing hypothesis
    if (body.hypothesis_id && body.action === "test") {
      const result = await testHypothesis(Number(body.hypothesis_id));
      return NextResponse.json({ ok: true, ...result });
    }

    // Persist a new hypothesis
    if (body.statement && body.persist) {
      const id = await createHypothesis(body.statement);
      return NextResponse.json({ ok: true, hypothesis_id: id });
    }

    // Just decompose (preview)
    if (body.statement) {
      const decomp = await decomposeHypothesis(body.statement);
      return NextResponse.json(decomp);
    }

    return NextResponse.json({ error: "statement or hypothesis_id required" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "unknown" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const db = supabaseAdmin();
    const { data, error } = await db
      .from("intel_hypotheses")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return NextResponse.json({ hypotheses: data ?? [] });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "unknown" }, { status: 500 });
  }
}
