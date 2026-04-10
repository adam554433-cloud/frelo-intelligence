import { Shell } from "@/components/Shell";
import { EmptyState } from "@/components/EmptyState";
import { supabaseAdmin } from "@/lib/supabase";

export const revalidate = 0;
export const dynamic = "force-dynamic";

async function getItems() {
  try {
    const db = supabaseAdmin();
    const { data } = await db
      .from("intel_items")
      .select("id, platform, content, url, source_title, sentiment, category, frelo_relevance, created_at")
      .order("frelo_relevance", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(100);
    return data ?? [];
  } catch {
    return [];
  }
}

const sentimentColors: Record<string, string> = {
  positive: "text-success",
  negative: "text-danger",
  neutral: "text-text-muted",
  mixed: "text-warning",
};

export default async function ItemsPage() {
  const items = await getItems();

  return (
    <Shell>
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <div className="text-sm uppercase tracking-[0.2em] text-accent-light">evidence</div>
          <h1 className="mt-2 font-serif text-4xl font-semibold">Every quote. Every source. Grounded.</h1>
        </div>

        {items.length === 0 ? (
          <EmptyState
            icon="Database"
            title="No items ingested yet."
            body="Trigger ingestion via /api/ingest/run?source=reddit or wait for the next cron run."
          />
        ) : (
          <div className="space-y-3">
            {items.map((it) => (
              <a
                key={it.id}
                href={it.url ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-card border border-surface-border bg-surface p-4 transition-colors hover:border-accent/30"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-pill bg-chocolate-light/50 px-2 py-0.5 uppercase text-accent-light">{it.platform}</span>
                  {it.source_title && <span className="text-text-muted">{it.source_title}</span>}
                  {it.sentiment && <span className={sentimentColors[it.sentiment] ?? ""}>{it.sentiment}</span>}
                  {it.category && <span className="text-text-muted">· {it.category}</span>}
                  {it.frelo_relevance !== null && (
                    <span className="ml-auto rounded-pill bg-accent/10 px-2 py-0.5 text-accent-light">
                      relevance {it.frelo_relevance}/10
                    </span>
                  )}
                </div>
                <div className="line-clamp-3 text-sm text-text-primary">{it.content}</div>
              </a>
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}
