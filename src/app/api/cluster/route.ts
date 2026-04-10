import { NextRequest, NextResponse } from "next/server";
import { runClustering } from "@/lib/clustering";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const threshold = Number(req.nextUrl.searchParams.get("threshold") ?? 0.7);
  const minSize = Number(req.nextUrl.searchParams.get("min_size") ?? 3);
  try {
    const result = await runClustering({ threshold, minSize });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "unknown" }, { status: 500 });
  }
}
