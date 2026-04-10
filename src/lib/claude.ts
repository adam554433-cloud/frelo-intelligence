import Anthropic from "@anthropic-ai/sdk";

let _client: Anthropic | null = null;

export function claude(): Anthropic {
  if (_client) return _client;
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY required");
  _client = new Anthropic({ apiKey: key });
  return _client;
}

export const MODELS = {
  deep: "claude-opus-4-6",
  fast: "claude-haiku-4-5-20251001",
} as const;

export type ModelTier = keyof typeof MODELS;

export async function ask(opts: {
  system?: string;
  user: string;
  tier?: ModelTier;
  maxTokens?: number;
  temperature?: number;
}): Promise<string> {
  const res = await claude().messages.create({
    model: MODELS[opts.tier ?? "fast"],
    max_tokens: opts.maxTokens ?? 4096,
    temperature: opts.temperature ?? 0.3,
    system: opts.system,
    messages: [{ role: "user", content: opts.user }],
  });
  const block = res.content[0];
  if (block.type !== "text") throw new Error("Unexpected non-text response");
  return block.text;
}

export function extractJSON<T = unknown>(text: string): T {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON object found in text");
  const cleaned = match[0].replace(/,\s*([}\]])/g, "$1");
  return JSON.parse(cleaned) as T;
}
