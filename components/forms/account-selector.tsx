"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type AccountOption = { id: number; name: string; owner: string };

export function AccountSelector({
  value,
  onChange,
  accounts,
  className,
  size = "default",
  allowEmpty = false,
}: {
  value: string;
  onChange: (v: string) => void;
  accounts: AccountOption[];
  className?: string;
  size?: "default" | "sm";
  allowEmpty?: boolean;
}) {
  const opts = allowEmpty
    ? [{ value: "", label: "—" }, ...accounts.map((a) => ({ value: String(a.id), label: a.name }))]
    : accounts.map((a) => ({ value: String(a.id), label: a.name }));

  return (
    <div
      role="radiogroup"
      className={cn(
        "inline-flex w-full rounded-md border border-input bg-background p-0.5",
        className,
      )}
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

export function ownerToAccountId(
  owner: string | null | undefined,
  accounts: AccountOption[],
): string {
  if (!owner) return "";
  const a = accounts.find((a) => a.owner === owner);
  return a ? String(a.id) : "";
}
