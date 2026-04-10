// Embedding helper — uses Voyage AI voyage-3 (1024 dims).
// Voyage is Anthropic's recommended embedding provider for Claude. Free tier: 1M tokens/month.
// Isolated here so we can swap providers without touching callers.

const VOYAGE_MODEL = "voyage-3";
const VOYAGE_URL = "https://api.voyageai.com/v1/embeddings";

export const EMBEDDING_DIM = 1024;

export async function embed(text: string): Promise<number[]> {
  const key = process.env.VOYAGE_API_KEY;
  if (!key) throw new Error("VOYAGE_API_KEY required for embeddings");

  const res = await fetch(VOYAGE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: VOYAGE_MODEL,
      input: [text.slice(0, 8000)],
      input_type: "document",
    }),
  });

  if (!res.ok) {
    throw new Error(`Voyage embedding error ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()) as { data: Array<{ embedding: number[] }> };
  return data.data[0].embedding;
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  const key = process.env.VOYAGE_API_KEY;
  if (!key) throw new Error("VOYAGE_API_KEY required for embeddings");

  // Voyage allows up to 128 inputs per request
  const CHUNK = 64;
  const out: number[][] = [];

  for (let i = 0; i < texts.length; i += CHUNK) {
    const chunk = texts.slice(i, i + CHUNK).map((t) => t.slice(0, 8000));
    const res = await fetch(VOYAGE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: VOYAGE_MODEL,
        input: chunk,
        input_type: "document",
      }),
    });

    if (!res.ok) {
      throw new Error(`Voyage embedding error ${res.status}: ${await res.text()}`);
    }

    const data = (await res.json()) as { data: Array<{ embedding: number[] }> };
    out.push(...data.data.map((d) => d.embedding));
  }

  return out;
}

// For query-time embeddings, Voyage recommends input_type="query" (asymmetric retrieval).
export async function embedQuery(text: string): Promise<number[]> {
  const key = process.env.VOYAGE_API_KEY;
  if (!key) throw new Error("VOYAGE_API_KEY required for embeddings");

  const res = await fetch(VOYAGE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: VOYAGE_MODEL,
      input: [text.slice(0, 8000)],
      input_type: "query",
    }),
  });

  if (!res.ok) {
    throw new Error(`Voyage embedding error ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()) as { data: Array<{ embedding: number[] }> };
  return data.data[0].embedding;
}
