import { supabaseAdmin } from "./supabase";

/**
 * Simple agglomerative clustering over already-embedded items.
 * For MVP we do a greedy nearest-neighbor clustering using the RPC.
 * Production would use HDBSCAN via pg extension, but this works for <10k items.
 */

interface ItemLite {
  id: number;
  content: string;
  platform: string;
  embedding: number[] | null;
  frelo_relevance: number | null;
}

function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

function centroid(vectors: number[][]): number[] {
  const dim = vectors[0].length;
  const sum = new Array(dim).fill(0);
  for (const v of vectors) for (let i = 0; i < dim; i++) sum[i] += v[i];
  return sum.map((s) => s / vectors.length);
}

export async function runClustering(opts: { threshold?: number; minSize?: number; maxItems?: number } = {}): Promise<{
  clusters: number;
}> {
  const db = supabaseAdmin();
  const threshold = opts.threshold ?? 0.7;
  const minSize = opts.minSize ?? 3;
  const maxItems = opts.maxItems ?? 2000;

  // Fetch embedded items
  const { data: rawItems, error } = await db
    .from("intel_items")
    .select("id, content, platform, embedding, frelo_relevance")
    .not("embedding", "is", null)
    .gte("frelo_relevance", 5)
    .order("frelo_relevance", { ascending: false })
    .limit(maxItems);

  if (error) throw new Error(`Fetch embedded: ${error.message}`);
  if (!rawItems || rawItems.length === 0) return { clusters: 0 };

  // Parse embeddings (they come back as strings from pgvector via PostgREST)
  const items: Array<ItemLite & { embedding: number[] }> = rawItems.map((it) => {
    const emb = typeof it.embedding === "string" ? JSON.parse(it.embedding) : (it.embedding as unknown as number[]);
    return { ...it, embedding: emb };
  });

  // Clear old clusters
  await db.from("intel_cluster_items").delete().gt("cluster_id", 0);
  await db.from("intel_clusters").delete().gt("id", 0);

  // Greedy clustering: each item is assigned to closest cluster above threshold
  type Cluster = { centroid: number[]; members: number[]; platforms: Set<string> };
  const clusters: Cluster[] = [];

  for (const it of items) {
    let bestIdx = -1;
    let bestSim = threshold;
    for (let i = 0; i < clusters.length; i++) {
      const sim = cosine(it.embedding, clusters[i].centroid);
      if (sim > bestSim) {
        bestIdx = i;
        bestSim = sim;
      }
    }
    if (bestIdx === -1) {
      clusters.push({
        centroid: it.embedding,
        members: [it.id],
        platforms: new Set([it.platform]),
      });
    } else {
      const c = clusters[bestIdx];
      c.members.push(it.id);
      c.platforms.add(it.platform);
      // Update centroid as running average
      const allEmbeddings = c.members
        .map((id) => items.find((x) => x.id === id)?.embedding)
        .filter((e): e is number[] => Array.isArray(e));
      c.centroid = centroid(allEmbeddings);
    }
  }

  // Filter out tiny clusters
  const big = clusters.filter((c) => c.members.length >= minSize);

  // Insert into DB
  let inserted = 0;
  for (const c of big) {
    const { data: row, error: insErr } = await db
      .from("intel_clusters")
      .insert({
        size: c.members.length,
        centroid: c.centroid as unknown as string,
        platforms: Array.from(c.platforms),
        cross_platform_score: c.platforms.size,
      })
      .select()
      .single();

    if (insErr || !row) continue;

    const links = c.members.map((itemId) => ({ cluster_id: row.id, item_id: itemId }));
    await db.from("intel_cluster_items").insert(links);
    inserted++;
  }

  await db.from("intel_events").insert({
    kind: "clustering_finished",
    payload: { clusters: inserted, total_items: items.length },
  });

  return { clusters: inserted };
}
