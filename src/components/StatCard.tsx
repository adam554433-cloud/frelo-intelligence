import * as Icons from "lucide-react";

export function StatCard({
  label,
  value,
  hint,
  icon,
  accent,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: string;
  accent?: boolean;
}) {
  const Icon = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[icon] ?? Icons.Circle;
  return (
    <div className="rounded-card border border-surface-border bg-surface p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-text-muted">{label}</div>
          <div
            className={`mt-2 font-serif text-3xl font-semibold ${
              accent ? "bg-brand-gradient bg-clip-text text-transparent" : ""
            }`}
          >
            {value}
          </div>
          {hint && <div className="mt-1 text-xs text-text-secondary">{hint}</div>}
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-card bg-accent/10 text-accent-light">
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}
