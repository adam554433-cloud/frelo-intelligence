import { NextRequest, NextResponse } from "next/server";
import { ingest, ingestBatch } from "@/lib/ingest";
import type { Platform } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // no secret configured, allow (dev mode)
  const provided =
    req.nextUrl.searchParams.get("secret") ??
    req.headers.get("authorization")?.replace("Bearer ", "");
  return provided === secret;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const source = (req.nextUrl.searchParams.get("source") ?? "reddit") as Platform;
  const query = req.nextUrl.searchParams.get("query");

  // If no query given, use default frelo queries for the platform
  const defaults: Record<string, string[]> = {
    reddit: ["creatine vegan", "creatine women", "creatine brain", "creatine gut", "best creatine"],
    tiktok: ["creatine", "creatine benefits", "creatine women"],
    youtube: ["creatine science", "creatine benefits brain"],
    trustpilot: ["trycreate.co", "optimumnutrition.com", "myprotein.com"],
  };

  const queries = query ? [query] : defaults[source] ?? ["creatine"];
  const tasks = queries.map((q) => ({ platform: source, query: q }));

  try {
    const results = await ingestBatch(tasks);
    return NextResponse.json({ ok: true, source, results });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const { platform, query, hypothesis_id } = await req.json();
    if (!platform || !query) {
      return NextResponse.json({ error: "platform + query required" }, { status: 400 });
    }
    const result = await ingest(platform as Platform, query, hypothesis_id);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
