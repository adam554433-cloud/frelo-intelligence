import { NextRequest, NextResponse } from "next/server";
import { generateStrategicBrief } from "@/lib/strategic-brief";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const brief = await generateStrategicBrief({
      focus: body.focus,
      horizon: body.horizon,
    });
    return NextResponse.json({ ok: true, brief });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "unknown" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const brief = await generateStrategicBrief({ horizon: "this_quarter" });
    return NextResponse.json({ ok: true, brief });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "unknown" }, { status: 500 });
  }
}
