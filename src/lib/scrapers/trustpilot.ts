import type { ScrapedItem } from "./types";

// Trustpilot scraper — fetches reviews for competitor domains.
// Uses the public trustpilot.com search + review pages (no API key required).
// Returns star rating in engagement field for easy sorting.

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

export async function scrapeTrustpilot(query: string, opts: { limit?: number } = {}): Promise<ScrapedItem[]> {
  const limit = opts.limit ?? 60;
  const results: ScrapedItem[] = [];

  // query is expected to be a domain like "trycreate.co" or a brand slug
  const domain = query.replace(/^https?:\/\//, "").replace(/\/$/, "").toLowerCase();
  const url = `https://www.trustpilot.com/review/${domain}?sort=recency`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" },
    });
    if (!res.ok) return results;
    const html = await res.text();

    // Trustpilot embeds reviews as JSON in a __NEXT_DATA__ script tag.
    const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
    if (!match) return results;

    const next = JSON.parse(match[1]) as {
      props?: {
        pageProps?: {
          reviews?: Array<{
            id?: string;
            text?: string;
            title?: string;
            rating?: number;
            dates?: { publishedDate?: string };
            consumer?: { displayName?: string };
          }>;
        };
      };
    };

    const reviews = next.props?.pageProps?.reviews ?? [];
    for (const r of reviews.slice(0, limit)) {
      const id = String(r.id ?? "");
      if (!id) continue;
      const text = `${r.title ?? ""}\n${r.text ?? ""}`.trim();
      if (text.length < 30) continue;
      results.push({
        platform: "trustpilot",
        external_id: `tp_${domain}_${id}`,
        content: `[${r.rating ?? "?"}/5 review of ${domain}] ${text}`.slice(0, 4000),
        author: r.consumer?.displayName || null,
        url: `https://www.trustpilot.com/reviews/${id}`,
        source_title: `Trustpilot · ${domain}`,
        posted_at: r.dates?.publishedDate || null,
        engagement: r.rating ?? 3,
      });
    }
  } catch {
    // Fail silently — fallback to empty
  }

  return results;
}
