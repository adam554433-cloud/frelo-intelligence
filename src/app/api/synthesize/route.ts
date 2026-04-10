import { NextRequest, NextResponse } from "next/server";
import { synthesizeAllAvatars, synthesizeAvatarForCluster } from "@/lib/avatar-synth";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const clusterId = req.nextUrl.searchParams.get("cluster_id");
  const maxClusters = Number(req.nextUrl.searchParams.get("max") ?? 8);

  try {
    if (clusterId) {
      const result = await synthesizeAvatarForCluster(Number(clusterId));
      return NextResponse.json({ ok: true, avatar: result });
    } else {
      const result = await synthesizeAllAvatars({ maxClusters });
      return NextResponse.json({ ok: true, ...result });
    }
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "unknown" }, { status: 500 });
  }
}
