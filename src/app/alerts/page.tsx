import { Shell } from "@/components/Shell";
import { EmptyState } from "@/components/EmptyState";

export default function AlertsPage() {
  return (
    <Shell>
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-8">
          <div className="text-sm uppercase tracking-[0.2em] text-accent-light">alerts</div>
          <h1 className="mt-2 font-serif text-4xl font-semibold">What changed in the last 24h.</h1>
        </div>
        <EmptyState
          icon="Bell"
          title="No alerts yet."
          body="Delta detection runs daily at 06:00 UTC. New themes, competitor complaint spikes, and narrative shifts will show up here."
          hint="Day 7: delta engine + daily digest."
        />
      </div>
    </Shell>
  );
}
