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

  return NextResponse.json({
    query,
    vector_len: vector.length,
    vector_first: vector.slice(0, 3),
    error: rpcResult.error,
    count: rpcResult.data?.length ?? 0,
    top: (rpcResult.data ?? []).map((r: { similarity: number; frelo_relevance: number; platform: string; content: string }) => ({
      similarity: r.similarity,
      frelo_relevance: r.frelo_relevance,
      platform: r.platform,
      snippet: r.content.slice(0, 100),
    })),
  });
}
