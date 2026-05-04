"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export const PAYER_OPTIONS: { value: string; label: string }[] = [
  { value: "tyler", label: "Tyler" },
  { value: "wife", label: "Michelle" },
  { value: "joint", label: "Joint" },
];

export function PayerSelector({
  value,
  onChange,
  className,
  size = "default",
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  size?: "default" | "sm";
}) {
  return (
    <div
      role="radiogroup"
      className={cn(
        "inline-flex w-full rounded-md border border-input bg-background p-0.5",
        className,
      )}
    >
      {PAYER_OPTIONS.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "flex-1 rounded-sm px-2 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              size === "sm" ? "py-1 text-xs" : "py-1.5 text-sm",
              active
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
