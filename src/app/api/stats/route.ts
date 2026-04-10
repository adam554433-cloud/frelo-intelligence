import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const db = supabaseAdmin();

    const [itemsRes, avatarsRes, hypsCountRes, hypsDataRes, alertsRes, sourcesRes] = await Promise.all([
      db.from("intel_items").select("*", { count: "exact", head: true }),
      db.from("intel_avatars").select("*", { count: "exact", head: true }).eq("status", "active"),
      db.from("intel_hypotheses").select("*", { count: "exact", head: true }),
      db.from("intel_hypotheses").select("status"),
      db.from("intel_alerts").select("seen"),
      db.from("intel_sources").select("*", { count: "exact", head: true }),
    ]);

    const hypothesesByStatus: Record<string, number> = {};
    for (const h of (hypsDataRes.data as Array<{ status: string }>) ?? []) {
      hypothesesByStatus[h.status] = (hypothesesByStatus[h.status] ?? 0) + 1;
    }

    const unreadAlerts = ((alertsRes.data as Array<{ seen: boolean }>) ?? []).filter((a) => !a.seen).length;

    return NextResponse.json({
      items: itemsRes.count ?? 0,
      avatars: avatarsRes.count ?? 0,
      hypotheses_total: hypsCountRes.count ?? 0,
      hypotheses_by_status: hypothesesByStatus,
      unread_alerts: unreadAlerts,
      sources: sourcesRes.count ?? 0,
    });
  } catch (err) {
    // Return zeros if DB not yet set up — graceful degradation
    return NextResponse.json({
      items: 0,
      avatars: 0,
      hypotheses_total: 0,
      hypotheses_by_status: {},
      unread_alerts: 0,
      sources: 0,
      note: err instanceof Error ? err.message : "unavailable",
    });
  }
}
