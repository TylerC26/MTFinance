"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type CategoryOption = { id: number; name: string };

export function CategorySelector({
  value,
  onChange,
  categories,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  categories: CategoryOption[];
  className?: string;
}) {
  const opts = [
    { value: "", label: "Uncategorized" },
    ...categories.map((c) => ({ value: String(c.id), label: c.name })),
  ];
  return (
    <div
      role="radiogroup"
      className={cn("flex flex-wrap gap-1.5", className)}
    >
      {opts.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value || "none"}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              active
                ? "border-foreground bg-foreground text-background"
                : "border-input bg-background text-muted-foreground hover:text-foreground hover:border-foreground/40",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
