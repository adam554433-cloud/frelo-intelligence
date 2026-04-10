import type { ScrapedItem } from "./types";

const PULLPUSH = "https://api.pullpush.io/reddit";

const RELEVANT_SUBS = [
  "supplements", "Creatine", "fitness", "nutrition", "Nootropics",
  "veganfitness", "PlantBasedDiet", "loseit", "gainit", "bodybuilding",
  "xxfitness", "Biohackers", "StackAdvice", "longevity", "AdvancedFitness",
  "HealthyFood", "GutHealth", "menopause", "Perimenopause", "AskMenOver30",
];

async function pp(endpoint: string, params: Record<string, string | number>): Promise<unknown[]> {
  const qs = new URLSearchParams(params as Record<string, string>).toString();
  const res = await fetch(`${PULLPUSH}${endpoint}?${qs}`, {
    headers: { "User-Agent": "frelo-intelligence/1.0" },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { data?: unknown[] };
  return data.data ?? [];
}

export async function scrapeReddit(query: string, opts: { limit?: number } = {}): Promise<ScrapedItem[]> {
  const limit = opts.limit ?? 200;
  const results: ScrapedItem[] = [];
  const seen = new Set<string>();

  // Phase 1: global submission search (top + new)
  for (const sort of ["score", "created_utc"] as const) {
    const posts = (await pp("/search/submission/", {
      q: query, size: 100, sort, sort_type: "desc",
    })) as Array<Record<string, unknown>>;

    for (const p of posts) {
      const id = String(p.id ?? "");
      if (!id || seen.has(id)) continue;
      seen.add(id);
      const title = String(p.title ?? "");
      const body = String(p.selftext ?? "");
      const content = `${title}\n${body}`.trim();
      if (content.length < 30) continue;
      results.push({
        platform: "reddit",
        external_id: `post_${id}`,
        content: content.slice(0, 6000),
        author: String(p.author ?? "unknown") || null,
        url: `https://reddit.com/r/${p.subreddit}/comments/${id}`,
        source_title: `r/${p.subreddit}`,
        posted_at: p.created_utc ? new Date(Number(p.created_utc) * 1000).toISOString() : null,
        engagement: Number(p.score ?? 0) + Number(p.num_comments ?? 0) * 2,
      });
      if (results.length >= limit) return results;
    }
  }

  // Phase 2: deep comment search
  for (const sort of ["score", "created_utc"] as const) {
    const comments = (await pp("/search/comment/", {
      q: query, size: 100, sort, sort_type: "desc",
    })) as Array<Record<string, unknown>>;

    for (const c of comments) {
      const id = String(c.id ?? "");
      const body = String(c.body ?? "");
      if (!id || seen.has(id) || body.length < 40 || body === "[deleted]" || body === "[removed]") continue;
      seen.add(id);
      results.push({
        platform: "reddit",
        external_id: `comment_${id}`,
        content: `[comment in r/${c.subreddit}]\n${body}`.slice(0, 4000),
        author: String(c.author ?? "unknown") || null,
        url: c.permalink ? `https://reddit.com${c.permalink}` : null,
        source_title: `r/${c.subreddit}`,
        posted_at: c.created_utc ? new Date(Number(c.created_utc) * 1000).toISOString() : null,
        engagement: Number(c.score ?? 0),
      });
      if (results.length >= limit) return results;
    }
  }

  // Phase 3: specific subreddit drill-downs
  for (const sub of RELEVANT_SUBS.slice(0, 10)) {
    if (results.length >= limit) break;
    const posts = (await pp("/search/submission/", {
      q: query, subreddit: sub, size: 25, sort: "score", sort_type: "desc",
    })) as Array<Record<string, unknown>>;

    for (const p of posts) {
      const id = String(p.id ?? "");
      if (!id || seen.has(id)) continue;
      seen.add(id);
      const content = `${p.title ?? ""}\n${p.selftext ?? ""}`.trim();
      if (content.length < 30) continue;
      results.push({
        platform: "reddit",
        external_id: `post_${id}`,
        content: content.slice(0, 6000),
        author: String(p.author ?? "unknown") || null,
        url: `https://reddit.com/r/${sub}/comments/${id}`,
        source_title: `r/${sub}`,
        posted_at: p.created_utc ? new Date(Number(p.created_utc) * 1000).toISOString() : null,
        engagement: Number(p.score ?? 0) + Number(p.num_comments ?? 0) * 2,
      });
      if (results.length >= limit) return results;
    }
  }

  return results;
}
