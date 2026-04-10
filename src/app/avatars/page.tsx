import { Shell } from "@/components/Shell";
import { EmptyState } from "@/components/EmptyState";

export default function AvatarsPage() {
  return (
    <Shell>
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <div className="text-sm uppercase tracking-[0.2em] text-accent-light">avatars</div>
          <h1 className="mt-2 font-serif text-4xl font-semibold">Audiences discovered from the data.</h1>
        </div>
        <EmptyState
          icon="Users"
          title="No avatars yet."
          body="Avatars will be synthesized from scraped consumer voice starting Day 2, with every claim grounded in a source quote."
          hint="Day 4 of the roadmap: Clustering + Avatar Synthesizer."
        />
      </div>
    </Shell>
  );
}
