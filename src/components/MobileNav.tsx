"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Icons from "lucide-react";
import { nav } from "@/config/nav";
import clsx from "clsx";

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close drawer when route changes
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Top bar — visible on mobile only */}
      <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between border-b border-surface-border bg-chocolate/80 backdrop-blur-md px-4 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-card bg-accent-gradient flex items-center justify-center">
            <Icons.Brain className="h-4 w-4 text-chocolate" />
          </div>
          <div>
            <div className="font-serif text-base font-semibold leading-none">frelo</div>
            <div className="text-[9px] uppercase tracking-[0.2em] text-accent-light mt-0.5">intelligence</div>
          </div>
        </Link>
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          className="flex h-10 w-10 items-center justify-center rounded-card border border-surface-border text-text-primary active:bg-surface-hover"
        >
          {open ? <Icons.X className="h-5 w-5" /> : <Icons.Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* Drawer overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={clsx(
          "lg:hidden fixed top-0 right-0 bottom-0 z-50 w-[85%] max-w-sm border-l border-surface-border bg-chocolate-light/95 backdrop-blur-xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
          <div className="text-xs uppercase tracking-[0.2em] text-accent-light">navigation</div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="flex h-9 w-9 items-center justify-center rounded-card text-text-primary active:bg-surface-hover"
          >
            <Icons.X className="h-5 w-5" />
          </button>
        </div>

        <nav className="px-3 py-4 space-y-1 overflow-y-auto">
          {nav.map((item) => {
            const Icon =
              (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[item.icon] ??
              Icons.Circle;
            const active =
              pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.id}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 rounded-card px-4 py-3 text-base font-medium transition-colors",
                  active
                    ? "bg-accent/15 text-accent-light"
                    : "text-text-secondary active:bg-surface-hover"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-surface-border p-4 text-xs text-text-muted">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-slow" />
            frelo intelligence · v1
          </div>
        </div>
      </div>
    </>
  );
}
