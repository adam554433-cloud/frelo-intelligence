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
 * Normalize query for embedding: strip punctuation, lowercase, trim.
 * Voyage query embeddings are sensitive to phrasing — normalization improves recall.
 */
function normalizeQuery(q: string): string {
  return q
    .replace(/[?.!,;:'"()[\]{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * Extract meaningful keywords from a query for trigram text search fallback.
 * Removes stop words and short tokens.
 */
const STOP = new Set([
  "the", "is", "a", "an", "and", "or", "but", "not", "to", "of", "in", "on", "for",
  "with", "about", "what", "how", "why", "when", "where", "who", "do", "does", "did",
  "have", "has", "had", "be", "been", "being", "are", "was", "were", "i", "you",
  "he", "she", "it", "we", "they", "my", "your", "their", "this", "that", "these",
  "those", "from", "by", "as", "at", "if", "then", "so", "can", "will", "would",
]);
function extractKeywords(q: string): string[] {
  return normalizeQuery(q)
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w))
    .slice(0, 5);
}

/**
 * Hybrid semantic + text search. Runs vector search first; if results are thin,
 * augments with ILIKE trigram matches on key terms.
 */
export async function searchItems(query: string, opts: { limit?: number; minSim?: number; minRelevance?: number } = {}): Promise<RagCitation[]> {
  const db = supabaseAdmin();
  const limit = opts.limit ?? 12;
  const minSim = opts.minSim ?? 0.35;
  const minRelevance = opts.minRelevance ?? 0;

  const results = new Map<number, RagCitation>();

  // Phase 1: semantic search with normalized query
  try {
    const normalized = normalizeQuery(query);
    const vector = await embedQuery(normalized);
    const { data, error } = await db.rpc("intel_search_items", {
      query_embedding: vector,
      match_threshold: minSim,
      match_count: limit,
      min_relevance: minRelevance,
    });

    if (error) {
      console.error("RAG vector search error:", error.message);
    } else if (data) {
      for (const row of data as RagCitation[]) {
        results.set(row.id, row);
      }
    }
  } catch (err) {
    console.error("RAG vector search threw:", err);
  }

  // Phase 2: keyword fallback — if vector search returned few results, add trigram matches
  if (results.size < Math.min(5, limit)) {
    try {
      const keywords = extractKeywords(query);
      if (keywords.length > 0) {
        // Build an OR filter across key terms
        const orFilter = keywords.map((kw) => `content.ilike.%${kw}%`).join(",");
        const { data } = await db
          .from("intel_items")
          .select("id, content, platform, url, frelo_relevance")
          .or(orFilter)
          .gte("frelo_relevance", Math.max(minRelevance, 5))
          .order("frelo_relevance", { ascending: false })
          .limit(limit - results.size);

        for (const row of (data ?? []) as Array<Omit<RagCitation, "similarity">>) {
          if (!results.has(row.id)) {
            results.set(row.id, { ...row, similarity: 0 });
          }
        }
      }
    } catch (err) {
      console.error("RAG keyword fallback error:", err);
    }
  }

  return Array.from(results.values()).slice(0, limit);
}

export function formatCitations(citations: RagCitation[]): string {
  if (citations.length === 0) return "(no evidence found in the intel database — answer from brand context only)";
  return citations
    .map((c, i) => `[src${i + 1}] (${c.platform}, relevance=${c.frelo_relevance ?? "?"}) ${c.content.slice(0, 700)}`)
    .join("\n\n");
}
