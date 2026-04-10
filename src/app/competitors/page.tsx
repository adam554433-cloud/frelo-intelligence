import { Shell } from "@/components/Shell";
import { Swords } from "lucide-react";

const COMPETITORS = [
  { name: "Create Wellness", domain: "trycreate.co", category: "Gummies · DTC", notes: "Recently raised. Watch for launches." },
  { name: "Optimum Nutrition", domain: "optimumnutrition.com", category: "Powder · Mass", notes: "Incumbent. Gym-bro branding." },
  { name: "MyProtein", domain: "myprotein.com", category: "Powder · UK", notes: "Price-led, broad catalog." },
  { name: "Thorne", domain: "thorne.com", category: "Powder · Clinical", notes: "Premium, MD-adjacent positioning." },
  { name: "Transparent Labs", domain: "transparentlabs.com", category: "Powder · Clean", notes: "No artificials, clean-label differentiation." },
];

export default function CompetitorsPage() {
  return (
    <Shell>
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-accent-light">
            <Swords className="h-4 w-4" />
            <span className="uppercase tracking-[0.2em]">competitors</span>
          </div>
          <h1 className="mt-2 font-serif text-4xl font-semibold">Know thy enemy.</h1>
          <p className="mt-2 text-text-secondary">
            Tracked brands. Day 5 adds continuous scraping of their reviews, complaints, and positioning shifts.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {COMPETITORS.map((c) => (
            <div key={c.name} className="rounded-card border border-surface-border bg-surface p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-serif text-xl font-semibold">{c.name}</div>
                  <a
                    href={`https://${c.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-accent-light hover:underline"
                  >
                    {c.domain}
                  </a>
                </div>
                <span className="rounded-pill border border-surface-border px-3 py-1 text-xs text-text-secondary">
                  {c.category}
                </span>
              </div>
              <p className="mt-3 text-sm text-text-secondary">{c.notes}</p>
              <div className="mt-4 text-xs text-text-muted">
                <span className="text-warning">◉</span> Ingestion pending (Day 5)
              </div>
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}
