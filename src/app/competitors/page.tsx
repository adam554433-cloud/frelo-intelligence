import { Shell } from "@/components/Shell";
import { Swords } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase";

export const revalidate = 0;
export const dynamic = "force-dynamic";

async function getData() {
  try {
    const db = supabaseAdmin();
    const { data: competitors } = await db.from("intel_competitors").select("*").eq("is_active", true);
    const { data: counts } = await db
      .from("intel_items")
      .select("platform, id")
      .eq("platform", "trustpilot");

    return {
      competitors: competitors ?? [],
      trustpilotCount: counts?.length ?? 0,
    };
  } catch {
    return { competitors: [], trustpilotCount: 0 };
  }
}

export default async function CompetitorsPage() {
  const { competitors, trustpilotCount } = await getData();

  return (
    <Shell>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-10">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-accent-light">
            <Swords className="h-4 w-4" />
            <span className="uppercase tracking-[0.2em]">competitors</span>
          </div>
          <h1 className="mt-2 font-serif text-3xl sm:text-4xl font-semibold">Know thy enemy.</h1>
          <p className="mt-2 text-sm sm:text-base text-text-secondary break-words">
            {trustpilotCount} Trustpilot reviews ingested. Scrape more via /api/ingest/run?source=trustpilot
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {competitors.map((c) => (
            <div key={c.id} className="rounded-card border border-surface-border bg-surface p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-serif text-lg sm:text-xl font-semibold">{c.name}</div>
                  {c.domain && (
                    <a
                      href={`https://${c.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-accent-light hover:underline break-all"
                    >
                      {c.domain}
                    </a>
                  )}
                </div>
                <span className="shrink-0 rounded-pill border border-surface-border px-2 sm:px-3 py-1 text-[10px] sm:text-xs text-text-secondary">
                  {c.category}
                </span>
              </div>
              {c.notes && <p className="mt-3 text-sm text-text-secondary">{c.notes}</p>}
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}
