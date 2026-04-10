import { NextRequest, NextResponse } from "next/server";
import { runAnalyzer } from "@/lib/analyzer";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? 100);
  try {
    const result = await runAnalyzer({ limit });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "unknown" }, { status: 500 });
  }
}
