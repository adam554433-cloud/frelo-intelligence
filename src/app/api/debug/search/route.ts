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

  // Also try calling PostgREST directly via fetch, bypassing Supabase JS
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL + "/rest/v1/rpc/intel_search_items";
  const directRes = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({
      query_embedding: vector,
      match_threshold: -1,
      match_count: 10,
      min_relevance: 0,
    }),
  });
  const directData = await directRes.json();

  // Also try with string format
  const vectorStr = `[${vector.join(",")}]`;
  const directStrRes = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({
      query_embedding: vectorStr,
      match_threshold: -1,
      match_count: 10,
      min_relevance: 0,
    }),
  });
  const directStrData = await directStrRes.json();

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
    direct_array: {
      status: directRes.status,
      count: Array.isArray(directData) ? directData.length : 0,
      sample: Array.isArray(directData) ? directData.slice(0, 2).map((r: { similarity: number }) => r.similarity) : directData,
    },
    direct_string: {
      status: directStrRes.status,
      count: Array.isArray(directStrData) ? directStrData.length : 0,
      sample: Array.isArray(directStrData) ? directStrData.slice(0, 2).map((r: { similarity: number }) => r.similarity) : directStrData,
    },
  });
}
