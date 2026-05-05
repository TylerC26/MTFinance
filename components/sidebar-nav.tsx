"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const items: Array<{
  href: string;
  label: string;
  glyph: string;
}> = [
  { href: "/", label: "Overview", glyph: "I" },
  { href: "/expenses", label: "Expenses", glyph: "II" },
  { href: "/bills", label: "Bills", glyph: "III" },
  { href: "/income", label: "Income", glyph: "IV" },
  { href: "/accounts", label: "Accounts", glyph: "V" },
  { href: "/investments", label: "Investments", glyph: "VI" },
  { href: "/categories", label: "Categories", glyph: "VII" },
  { href: "/reports", label: "Reports", glyph: "VIII" },
];

export function SidebarNav() {
  const pathname = usePathname();
  const params = useSearchParams();
  const month = params.get("month");

  return (
    <nav className="px-3 pt-5">
      <p className="eyebrow px-3 mb-2">Index</p>
      <ul className="flex flex-col gap-px">
        {items.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const href = month ? `${item.href}?month=${month}` : item.href;
          return (
            <li key={item.href}>
              <Link
                href={href}
                className={cn(
                  "group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors relative",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "font-mono text-[10px] tracking-widest w-7 shrink-0",
                    active ? "text-accent" : "text-muted-foreground/70",
                  )}
                >
                  {item.glyph}
                </span>
                <span className="font-display tracking-tight">
                  {item.label}
                </span>
                {active ? (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[2px] rounded-r bg-accent"
                    aria-hidden
                  />
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
