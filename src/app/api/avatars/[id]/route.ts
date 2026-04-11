import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: "invalid id" }, { status: 400 });
  try {
    const body = await req.json();
    const allowed = [
      "name",
      "age_range",
      "gender_skew",
      "profile",
      "market_size",
      "pain_points",
      "desires",
      "language_patterns",
      "emotional_triggers",
      "how_frelo_fits",
      "hooks",
      "marketing_angles",
      "sales_messages",
      "ad_headlines",
      "video_script",
      "confidence_score",
      "momentum_score",
      "status",
    ];
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const k of allowed) if (k in body) update[k] = body[k];
    const db = supabaseAdmin();
    const { data, error } = await db.from("intel_avatars").update(update).eq("id", id).select().single();
    if (error) throw error;
    return NextResponse.json({ ok: true, avatar: data });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "unknown" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: "invalid id" }, { status: 400 });
  try {
    const db = supabaseAdmin();
    const { error } = await db.from("intel_avatars").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "unknown" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: "invalid id" }, { status: 400 });
  try {
    const { action } = await req.json();
    const db = supabaseAdmin();
    if (action === "archive" || action === "activate") {
      const status = action === "archive" ? "archived" : "active";
      const { error } = await db.from("intel_avatars").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
      return NextResponse.json({ ok: true, status });
    }
    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "unknown" }, { status: 500 });
  }
}
