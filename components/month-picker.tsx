"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import {
  currentYearMonth,
  formatYearMonthLabel,
  isValidYearMonth,
  shiftMonth,
  type YearMonth,
} from "@/lib/dates";

export function useSelectedMonth(): YearMonth {
  const params = useSearchParams();
  const raw = params.get("month");
  if (raw && isValidYearMonth(raw)) return raw;
  return currentYearMonth();
}

export function MonthPicker() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const ym = useSelectedMonth();

  const go = (next: YearMonth) => {
    const sp = new URLSearchParams(params.toString());
    sp.set("month", next);
    router.push(`${pathname}?${sp.toString()}`);
  };

  const isCurrent = ym === currentYearMonth();
  const [month, year] = formatYearMonthLabel(ym).split(" ");

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => go(shiftMonth(ym, -1))}
        className="size-7 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label="Previous month"
      >
        <ChevronLeftIcon className="size-4" />
      </button>
      <div className="flex items-baseline gap-2 min-w-[7rem] sm:min-w-[10rem] justify-center">
        <span className="font-display text-sm sm:text-base tracking-tight">
          {month}
        </span>
        <span className="font-mono text-[10px] sm:text-[11px] text-muted-foreground tracking-wider">
          {year}
        </span>
      </div>
      <button
        type="button"
        onClick={() => go(shiftMonth(ym, 1))}
        className="size-7 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label="Next month"
      >
        <ChevronRightIcon className="size-4" />
      </button>
      {!isCurrent ? (
        <button
          type="button"
          onClick={() => go(currentYearMonth())}
          className="hidden sm:inline-block ml-2 font-mono text-[10px] uppercase tracking-[0.16em] text-accent hover:underline underline-offset-4"
        >
          → today
        </button>
      ) : null}
    </div>
  );
}
