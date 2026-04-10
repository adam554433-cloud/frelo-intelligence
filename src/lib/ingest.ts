import { supabaseAdmin } from "./supabase";
import { runScraper } from "./scrapers";
import type { Platform } from "./types";

export async function ingest(platform: Platform, query: string, hypothesisId?: number): Promise<{
  sourceId: number;
  found: number;
  inserted: number;
}> {
  const db = supabaseAdmin();

  // Create source row
  const { data: source, error: sourceErr } = await db
    .from("intel_sources")
    .insert({
      platform,
      query,
      hypothesis_id: hypothesisId ?? null,
      status: "running",
    })
    .select()
    .single();

  if (sourceErr || !source) throw new Error(`Failed to create source: ${sourceErr?.message}`);

  try {
    const items = await runScraper(platform, query, 200);

    // Dedup via pre-check (partial unique index means onConflict won't work cleanly)
    const externalIds = items.map((it) => it.external_id);
    const { data: existing } = await db
      .from("intel_items")
      .select("external_id")
      .eq("platform", platform)
      .in("external_id", externalIds);

    const existingSet = new Set((existing ?? []).map((e) => e.external_id as string));
    const newItems = items.filter((it) => !existingSet.has(it.external_id));

    let inserted = 0;
    const chunkErrors: string[] = [];
    const CHUNK = 50;
    for (let i = 0; i < newItems.length; i += CHUNK) {
      const chunk = newItems.slice(i, i + CHUNK).map((it) => ({
        source_id: source.id,
        platform: it.platform,
        external_id: it.external_id,
        content: it.content,
        author: it.author,
        url: it.url,
        source_title: it.source_title,
        posted_at: it.posted_at,
        engagement: it.engagement,
      }));

      const { data: insertedRows, error } = await db
        .from("intel_items")
        .insert(chunk)
        .select("id");

      if (error) {
        console.error(`[ingest ${platform} "${query}"] insert chunk ${i} error:`, error.message, error.details, error.hint);
        chunkErrors.push(error.message);
      } else {
        inserted += insertedRows?.length ?? 0;
      }
    }

    await db
      .from("intel_sources")
      .update({
        status: chunkErrors.length > 0 && inserted === 0 ? "error" : "done",
        items_found: items.length,
        error_message: chunkErrors.length > 0 ? chunkErrors.slice(0, 3).join(" | ") : null,
        finished_at: new Date().toISOString(),
      })
      .eq("id", source.id);

    await db.from("intel_events").insert({
      kind: "ingest_finished",
      payload: { platform, query, found: items.length, inserted, errors: chunkErrors.length, source_id: source.id },
    });

    return { sourceId: source.id, found: items.length, inserted };
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    await db
      .from("intel_sources")
      .update({ status: "error", error_message: message, finished_at: new Date().toISOString() })
      .eq("id", source.id);
    throw err;
  }
}

export async function ingestBatch(tasks: Array<{ platform: Platform; query: string; hypothesisId?: number }>): Promise<
  Array<{ platform: Platform; query: string; ok: boolean; found?: number; inserted?: number; error?: string }>
> {
  const results = [];
  for (const task of tasks) {
    try {
      const r = await ingest(task.platform, task.query, task.hypothesisId);
      results.push({ platform: task.platform, query: task.query, ok: true, found: r.found, inserted: r.inserted });
    } catch (err) {
      results.push({
        platform: task.platform,
        query: task.query,
        ok: false,
        error: err instanceof Error ? err.message : "unknown error",
      });
    }
  }
  return results;
}
