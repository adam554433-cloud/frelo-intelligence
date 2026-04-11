import { NextRequest, NextResponse } from "next/server";
import { generateDailyDigest, getLatestDigest } from "@/lib/daily-digest";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get("action");

  // Cron or manual: regenerate
  if (action === "generate") {
    const secret = process.env.CRON_SECRET;
    if (secret) {
      const provided =
        req.nextUrl.searchParams.get("secret") ?? req.headers.get("authorization")?.replace("Bearer ", "");
      if (provided !== secret) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    try {
      const digest = await generateDailyDigest();
      return NextResponse.json({ ok: true, digest });
    } catch (err) {
      return NextResponse.json({ error: err instanceof Error ? err.message : "unknown" }, { status: 500 });
    }
  }

  // Default: return latest persisted
  const latest = await getLatestDigest();
  return NextResponse.json({ ok: true, digest: latest });
}
