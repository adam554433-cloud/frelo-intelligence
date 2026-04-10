import { NextRequest, NextResponse } from "next/server";
import { exportCreativeBrief } from "@/lib/creative-brief";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const avatarId = Number(req.nextUrl.searchParams.get("id"));
  const angleIndex = Number(req.nextUrl.searchParams.get("angle") ?? 0);
  if (!avatarId) return NextResponse.json({ error: "id required" }, { status: 400 });
  try {
    const brief = await exportCreativeBrief(avatarId, angleIndex);
    return NextResponse.json(brief);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "unknown" }, { status: 500 });
  }
}
