import type { Platform } from "@/lib/types";

export interface ScrapedItem {
  platform: Platform;
  external_id: string;
  content: string;
  author: string | null;
  url: string | null;
  source_title: string | null;
  posted_at: string | null;
  engagement: number;
}

export type ScraperFn = (query: string, opts?: { limit?: number }) => Promise<ScrapedItem[]>;
