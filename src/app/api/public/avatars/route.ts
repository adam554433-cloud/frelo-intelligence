import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { exportCreativeBrief } from "@/lib/creative-brief";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Public (CORS-enabled) read-only API for sibling apps (creative-hub, influencer-hub)
// to consume avatars and creative briefs.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS });
}

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    const brief = req.nextUrl.searchParams.get("brief");
    const db = supabaseAdmin();

    // Single avatar + brief
    if (id) {
      if (brief === "true" || brief === "1") {
        const angleIndex = Number(req.nextUrl.searchParams.get("angle") ?? 0);
        const creativeBrief = await exportCreativeBrief(Number(id), angleIndex);
        return NextResponse.json({ ok: true, brief: creativeBrief }, { headers: CORS });
      }
      const { data, error } = await db.from("intel_avatars").select("*").eq("id", Number(id)).single();
      if (error) throw error;
      return NextResponse.json({ ok: true, avatar: data }, { headers: CORS });
    }

    // List of active avatars
    const { data, error } = await db
      .from("intel_avatars")
      .select("id, name, age_range, gender_skew, profile, market_size, confidence_score, momentum_score, citation_count, how_frelo_fits")
      .eq("status", "active")
      .order("confidence_score", { ascending: false })
      .limit(50);
    if (error) throw error;
    return NextResponse.json({ ok: true, avatars: data ?? [] }, { headers: CORS });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "unknown" }, { status: 500, headers: CORS });
  }
}
