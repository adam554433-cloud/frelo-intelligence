import { supabaseAdmin } from "./supabase";
import { embedBatch } from "./embed";

const BATCH_SIZE = 16;

export async function runEmbeddingPipeline(opts: { limit?: number; minRelevance?: number } = {}): Promise<{
  embedded: number;
}> {
  const db = supabaseAdmin();
  const limit = opts.limit ?? 200;
  const minRelevance = opts.minRelevance ?? 4;

  // Only embed analyzed items that pass relevance threshold
  const { data: items, error } = await db
    .from("intel_items")
    .select("id, content")
    .is("embedded_at", null)
    .not("analyzed_at", "is", null)
    .gte("frelo_relevance", minRelevance)
    .limit(limit);

  if (error) throw new Error(`Fetch items to embed: ${error.message}`);
  if (!items || items.length === 0) return { embedded: 0 };

  let embedded = 0;

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    try {
      const vectors = await embedBatch(batch.map((it) => it.content));
      for (let j = 0; j < batch.length; j++) {
        await db
          .from("intel_items")
          .update({
            embedding: vectors[j] as unknown as string, // pgvector accepts array
            embedded_at: new Date().toISOString(),
          })
          .eq("id", batch[j].id);
        embedded++;
      }
    } catch (err) {
      console.error(`Embedding batch error:`, err);
    }
  }

  return { embedded };
}
