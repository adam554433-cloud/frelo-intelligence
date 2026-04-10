import { Shell } from "@/components/Shell";
import { EmptyState } from "@/components/EmptyState";

export default function ItemsPage() {
  return (
    <Shell>
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <div className="text-sm uppercase tracking-[0.2em] text-accent-light">evidence</div>
          <h1 className="mt-2 font-serif text-4xl font-semibold">Every quote. Every source. Grounded.</h1>
        </div>
        <EmptyState
          icon="Database"
          title="No items ingested yet."
          body="Scraped posts, comments, reviews and transcripts will appear here. Each item scored for frelo relevance and searchable semantically."
          hint="Day 2: ingestion workers + frelo-relevance scoring."
        />
      </div>
    </Shell>
  );
}
