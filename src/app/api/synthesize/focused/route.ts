import { NextRequest, NextResponse } from "next/server";
import { synthesizeFocusedAvatars } from "@/lib/focused-synth";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Focused synthesis: given a central angle, find sub-avatars within it.
 *
 * POST body: { "angle": "sarcopenia and muscle loss in aging women", "maxItems": 40, "maxAvatars": 4 }
 * GET: /api/synthesize/focused?angle=sarcopenia&max=4
 */
export async function POST(req: NextRequest) {
  try {
    const { angle, maxItems, maxAvatars } = await req.json();
    if (!angle) return NextResponse.json({ error: "angle required" }, { status: 400 });
    const result = await synthesizeFocusedAvatars({ angle, maxItems, maxAvatars });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "unknown" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const angle = req.nextUrl.searchParams.get("angle");
  const maxAvatars = Number(req.nextUrl.searchParams.get("max") ?? 4);
  if (!angle) return NextResponse.json({ error: "angle query param required" }, { status: 400 });
  try {
    const result = await synthesizeFocusedAvatars({ angle, maxAvatars });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "unknown" }, { status: 500 });
  }
}
