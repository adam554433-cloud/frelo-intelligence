import type { Platform } from "@/lib/types";
import type { ScrapedItem, ScraperFn } from "./types";
import { scrapeReddit } from "./reddit";
import { scrapeTikTok } from "./tiktok";
import { scrapeYouTube } from "./youtube";
import { scrapeTrustpilot } from "./trustpilot";

export const SCRAPERS: Partial<Record<Platform, ScraperFn>> = {
  reddit: scrapeReddit,
  tiktok: scrapeTikTok,
  youtube: scrapeYouTube,
  trustpilot: scrapeTrustpilot,
};

export const AVAILABLE_PLATFORMS = Object.keys(SCRAPERS) as Platform[];

export async function runScraper(platform: Platform, query: string, limit?: number): Promise<ScrapedItem[]> {
  const fn = SCRAPERS[platform];
  if (!fn) throw new Error(`Scraper not implemented: ${platform}`);
  return fn(query, { limit });
}

export type { ScrapedItem };
