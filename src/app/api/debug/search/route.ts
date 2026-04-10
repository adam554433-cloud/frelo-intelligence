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

  // Step 2: direct RPC with the vector
  const rpcResult = await db.rpc("intel_search_items", {
    query_embedding: vector,
    match_threshold: 0.3,
    match_count: 5,
    min_relevance: 4,
  });

  // Step 3: try passing as string format
  const vectorStr = `[${vector.join(",")}]`;
  const rpcResultStr = await db.rpc("intel_search_items", {
    query_embedding: vectorStr,
    match_threshold: 0.3,
    match_count: 5,
    min_relevance: 4,
  });

  return NextResponse.json({
    query,
    vector_len: vector.length,
    vector_first: vector.slice(0, 3),
    vector_sum: vector.slice(0, 10).reduce((a, b) => a + b, 0),
    as_array: {
      error: rpcResult.error,
      count: rpcResult.data?.length ?? 0,
      data: rpcResult.data,
    },
    as_string: {
      error: rpcResultStr.error,
      count: rpcResultStr.data?.length ?? 0,
      data: rpcResultStr.data,
    },
  });
}
