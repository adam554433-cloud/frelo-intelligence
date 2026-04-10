// Embedding helper — uses OpenAI text-embedding-3-small (1536 dims, cheap, strong).
// Keeping this isolated so we can swap to another provider without touching callers.

export async function embed(text: string): Promise<number[]> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY required for embeddings");

  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text.slice(0, 8000),
    }),
  });

  if (!res.ok) {
    throw new Error(`Embedding API error ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  return data.data[0].embedding as number[];
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY required for embeddings");

  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: texts.map((t) => t.slice(0, 8000)),
    }),
  });

  if (!res.ok) {
    throw new Error(`Embedding API error ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  return (data.data as Array<{ embedding: number[] }>).map((d) => d.embedding);
}
