import { supabaseAdmin } from "./supabase";
import { embedQuery } from "./embed";

export interface RagCitation {
  id: number;
  content: string;
  platform: string;
  url: string | null;
  similarity: number;
  frelo_relevance: number | null;
}

/**
 * Semantic search over intel_items using pgvector.
 * Falls back gracefully if no embeddings exist yet.
 */
export async function searchItems(query: string, opts: { limit?: number; minSim?: number; minRelevance?: number } = {}): Promise<RagCitation[]> {
  const db = supabaseAdmin();
  const limit = opts.limit ?? 12;
  const minSim = opts.minSim ?? 0.6;
  const minRelevance = opts.minRelevance ?? 0;

  try {
    const vector = await embedQuery(query);
    // PostgREST RPC accepts vector as a JSON array directly
    const { data, error } = await db.rpc("intel_search_items", {
      query_embedding: vector,
      match_threshold: minSim,
      match_count: limit,
      min_relevance: minRelevance,
    });

    if (error) {
      console.error("RAG search RPC error:", error.message, error.details);
      throw error;
    }
    return (data ?? []) as RagCitation[];
  } catch (err) {
    console.error("RAG search error:", err);
    return [];
  }
}

export function formatCitations(citations: RagCitation[]): string {
  if (citations.length === 0) return "(no evidence found in the intel database — answer from brand context only)";
  return citations
    .map((c, i) => `[src${i + 1}] (${c.platform}, relevance=${c.frelo_relevance ?? "?"}) ${c.content.slice(0, 700)}`)
    .join("\n\n");
}
