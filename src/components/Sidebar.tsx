"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Icons from "lucide-react";
import { nav } from "@/config/nav";
import clsx from "clsx";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-surface-border bg-chocolate/40 backdrop-blur-sm">
      <div className="flex items-center gap-3 px-6 py-6 border-b border-surface-border">
        <div className="h-9 w-9 rounded-card bg-accent-gradient flex items-center justify-center">
          <Icons.Brain className="h-5 w-5 text-chocolate" />
        </div>
        <div>
          <div className="font-serif text-lg font-semibold leading-tight">frelo</div>
          <div className="text-[11px] uppercase tracking-[0.2em] text-accent-light">intelligence</div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map((item) => {
          const Icon = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[item.icon] ?? Icons.Circle;
          const active = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.id}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 rounded-card px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-accent/15 text-accent-light"
                  : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-surface-border p-4 text-xs text-text-muted">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-slow" />
          Phase 1 · Foundation
        </div>
      </div>
    </aside>
  );
}
