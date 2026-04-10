import * as Icons from "lucide-react";

export function EmptyState({
  icon,
  title,
  body,
  hint,
}: {
  icon: string;
  title: string;
  body: string;
  hint?: string;
}) {
  const Icon = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[icon] ?? Icons.Circle;
  return (
    <div className="mx-auto max-w-xl rounded-card border border-dashed border-surface-border bg-surface/40 p-10 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-card bg-accent/10 text-accent-light">
        <Icon className="h-6 w-6" />
      </div>
      <h2 className="font-serif text-2xl font-semibold text-text-primary">{title}</h2>
      <p className="mt-2 text-text-secondary">{body}</p>
      {hint && <p className="mt-4 text-xs text-text-muted">{hint}</p>}
    </div>
  );
}
