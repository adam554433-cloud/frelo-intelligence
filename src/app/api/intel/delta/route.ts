import { NextRequest, NextResponse } from "next/server";
import { runDeltaDetection } from "@/lib/delta";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const provided = req.nextUrl.searchParams.get("secret") ?? req.headers.get("authorization")?.replace("Bearer ", "");
    if (provided !== secret) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const result = await runDeltaDetection();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "unknown" }, { status: 500 });
  }
}
