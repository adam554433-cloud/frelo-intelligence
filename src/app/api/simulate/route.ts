import { NextRequest, NextResponse } from "next/server";
import { simulateAdCopy, redTeamClaim } from "@/lib/persona-sim";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.mode === "red_team" && body.claim) {
      const result = await redTeamClaim(body.claim);
      return NextResponse.json({ ok: true, ...result });
    }

    if (body.ad_copy) {
      const reactions = await simulateAdCopy(body.ad_copy, body.avatar_ids);
      return NextResponse.json({ ok: true, reactions });
    }

    return NextResponse.json({ error: "ad_copy or claim required" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "unknown" }, { status: 500 });
  }
}
