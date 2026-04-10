import type { ScrapedItem } from "./types";

const TIKWM = "https://www.tikwm.com";

async function tikwm(path: string): Promise<Record<string, unknown> | null> {
  const res = await fetch(`${TIKWM}${path}`, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Accept: "application/json",
    },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as Record<string, unknown>;
  if (data.code === -1) return null;
  return data;
}

export async function scrapeTikTok(query: string, opts: { limit?: number } = {}): Promise<ScrapedItem[]> {
  const limit = opts.limit ?? 120;
  const results: ScrapedItem[] = [];
  const seen = new Set<string>();

  // Fetch videos
  const searchData = await tikwm(`/api/feed/search/?keywords=${encodeURIComponent(query)}&count=30&cursor=0`);
  const videos = (searchData?.data as { videos?: Array<Record<string, unknown>> })?.videos ?? [];

  // Sort by engagement and take top 20 for deep comment scraping
  videos.sort((a, b) => {
    const sA = Number(a.comment_count ?? 0) * 3 + Number(a.digg_count ?? 0);
    const sB = Number(b.comment_count ?? 0) * 3 + Number(b.digg_count ?? 0);
    return sB - sA;
  });

  // Add videos themselves as items
  for (const v of videos) {
    const vid = String(v.video_id ?? "");
    if (!vid || seen.has(vid)) continue;
    seen.add(vid);
    const title = String(v.title ?? "");
    if (title.length < 15) continue;
    const author = (v.author as { unique_id?: string; nickname?: string }) ?? {};
    results.push({
      platform: "tiktok",
      external_id: `video_${vid}`,
      content: title.slice(0, 3000),
      author: author.unique_id || author.nickname || null,
      url: `https://www.tiktok.com/@${author.unique_id ?? "user"}/video/${vid}`,
      source_title: `TikTok · ${author.nickname ?? author.unique_id ?? "user"}`,
      posted_at: v.create_time ? new Date(Number(v.create_time) * 1000).toISOString() : null,
      engagement: Number(v.comment_count ?? 0) * 3 + Number(v.digg_count ?? 0),
    });
  }

  // Deep scrape: fetch comments for top 15 videos
  const topVideos = videos.slice(0, 15);
  for (const v of topVideos) {
    if (results.length >= limit) break;
    const vid = String(v.video_id ?? "");
    if (!vid) continue;
    try {
      const commentData = await tikwm(`/api/comment/list/?aweme_id=${vid}&count=20&cursor=0`);
      const comments = ((commentData?.data as { comments?: Array<Record<string, unknown>> })?.comments) ?? [];
      for (const c of comments) {
        const cid = String(c.id ?? c.cid ?? "");
        const text = String(c.text ?? "");
        if (!cid || seen.has(cid) || text.length < 25) continue;
        seen.add(cid);
        const user = (c.user as { unique_id?: string; nickname?: string }) ?? {};
        results.push({
          platform: "tiktok",
          external_id: `comment_${cid}`,
          content: `[TikTok comment] ${text}`.slice(0, 2000),
          author: user.unique_id || user.nickname || null,
          url: `https://www.tiktok.com/@${(v.author as { unique_id?: string })?.unique_id ?? "user"}/video/${vid}`,
          source_title: `TikTok comment`,
          posted_at: c.create_time ? new Date(Number(c.create_time) * 1000).toISOString() : null,
          engagement: Number(c.digg_count ?? 0),
        });
        if (results.length >= limit) break;
      }
    } catch {
      // continue on comment fetch failure
    }
  }

  return results;
}
