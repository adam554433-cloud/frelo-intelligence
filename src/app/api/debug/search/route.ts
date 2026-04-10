import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { embedQuery } from "@/lib/embed";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { query } = await req.json();
  const db = supabaseAdmin();

  // Step 1: embed
  const vector = await embedQuery(query);

  // No threshold, no relevance filter — show what the vector actually matches
  const rpcResult = await db.rpc("intel_search_items", {
    query_embedding: vector,
    match_threshold: -1,
    match_count: 10,
    min_relevance: 0,
  });

  // Sanity checks on the vector
  const hasNaN = vector.some((v) => Number.isNaN(v));
  const hasInf = vector.some((v) => !Number.isFinite(v));
  const magnitude = Math.sqrt(vector.reduce((s, v) => s + v * v, 0));
  const allZero = vector.every((v) => v === 0);

  // Also try a raw SELECT via rpc — skip the RPC function entirely
  const { data: rawSelect, error: rawErr } = await db
    .from("intel_items")
    .select("id, content, platform, frelo_relevance")
    .not("embedding", "is", null)
    .limit(3);

  return NextResponse.json({
    query,
    vector_len: vector.length,
    vector_first: vector.slice(0, 5),
    vector_magnitude: magnitude,
    vector_hasNaN: hasNaN,
    vector_hasInf: hasInf,
    vector_allZero: allZero,
    rpc_error: rpcResult.error,
    rpc_count: rpcResult.data?.length ?? 0,
    rpc_top: (rpcResult.data ?? []).map((r: { similarity: number; frelo_relevance: number; platform: string; content: string }) => ({
      similarity: r.similarity,
      frelo_relevance: r.frelo_relevance,
      platform: r.platform,
      snippet: r.content.slice(0, 100),
    })),
    raw_items_with_embedding: rawSelect?.length ?? 0,
    raw_error: rawErr,
  });
}
