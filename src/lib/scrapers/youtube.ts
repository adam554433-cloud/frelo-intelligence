import type { ScrapedItem } from "./types";

const INSTANCES = [
  "https://y.com.sb",
  "https://invidious.projectsegfau.lt",
  "https://invidious.slipfox.xyz",
  "https://invidious.privacyredirect.com",
  "https://invidious.nerdvpn.de",
  "https://inv.nadeko.net",
];

async function findInstance(): Promise<string | null> {
  const results = await Promise.allSettled(
    INSTANCES.map(async (inst) => {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 5000);
      const r = await fetch(`${inst}/api/v1/stats`, { signal: ctrl.signal });
      clearTimeout(t);
      if (r.ok) return inst;
      throw new Error("not ok");
    })
  );
  for (const r of results) if (r.status === "fulfilled") return r.value;
  return null;
}

function parseVTT(vtt: string): string {
  const lines = vtt.split("\n");
  const out: string[] = [];
  let last = "";
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.includes("-->") || t === "WEBVTT" || /^\d+$/.test(t)) continue;
    const clean = t.replace(/<[^>]+>/g, "").trim();
    if (clean && clean !== last) {
      out.push(clean);
      last = clean;
    }
  }
  return out.join(" ").slice(0, 5000);
}

export async function scrapeYouTube(query: string, opts: { limit?: number } = {}): Promise<ScrapedItem[]> {
  const limit = opts.limit ?? 40;
  const results: ScrapedItem[] = [];
  const seen = new Set<string>();

  const instance = await findInstance();
  if (!instance) return results;

  try {
    const res = await fetch(`${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video&sort_by=relevance`);
    if (!res.ok) return results;
    const videos = (await res.json()) as Array<Record<string, unknown>>;

    for (const v of videos.slice(0, 25)) {
      if (results.length >= limit) break;
      const id = String(v.videoId ?? "");
      if (!id || seen.has(id)) continue;
      seen.add(id);
      const title = String(v.title ?? "");
      const description = String(v.description ?? "");
      const author = String(v.author ?? "");
      const viewCount = Number(v.viewCount ?? 0);

      // Try to fetch transcript
      let transcript = "";
      try {
        const captionsRes = await fetch(`${instance}/api/v1/captions/${id}`);
        if (captionsRes.ok) {
          const captions = (await captionsRes.json()) as { captions?: Array<{ language_code?: string; label?: string; url?: string }> };
          const track =
            captions.captions?.find((c) => c.language_code === "en" && c.label?.includes("auto")) ??
            captions.captions?.find((c) => c.language_code === "en") ??
            captions.captions?.[0];
          if (track?.url) {
            const vttRes = await fetch(`${instance}${track.url}`);
            if (vttRes.ok) transcript = parseVTT(await vttRes.text());
          }
        }
      } catch {}

      const content = transcript ? `${title}\n\n${transcript}` : `${title}\n${description}`.slice(0, 3000);
      if (content.length < 50) continue;

      results.push({
        platform: "youtube",
        external_id: `video_${id}`,
        content,
        author: author || null,
        url: `https://youtube.com/watch?v=${id}`,
        source_title: `YouTube · ${author}`,
        posted_at: v.published ? new Date(Number(v.published) * 1000).toISOString() : null,
        engagement: viewCount,
      });
    }
  } catch {
    // fail silently
  }

  return results;
}
