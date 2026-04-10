import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 min (Vercel Pro) — Day 2 will use this for long scrapes

// Day 1: stub. Day 2: full scrape pipeline per platform.
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret") ?? req.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const source = req.nextUrl.searchParams.get("source");
  return NextResponse.json({
    ok: true,
    note: "Ingestion worker stub — Day 2 will implement real scrapers",
    source,
    timestamp: new Date().toISOString(),
  });
}
