"use client";

import { formatCents } from "@/lib/money";

type Row = {
  label: string;
  color: string;
  spentCents: number;
  budgetCents: number;
};

export function BudgetBars({ rows }: { rows: Row[] }) {
  if (rows.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-6 text-center font-mono">
        — no entries logged this month —
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      {rows.map((r) => {
        const pct =
          r.budgetCents > 0
            ? Math.min(100, (r.spentCents / r.budgetCents) * 100)
            : null;
        const over = r.budgetCents > 0 && r.spentCents > r.budgetCents;
        const overage = over ? r.spentCents - r.budgetCents : 0;
        return (
          <div key={r.label} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-3 leader">
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: r.color }}
                  aria-hidden
                />
                <span className="text-sm">{r.label}</span>
              </div>
              <span className="leader-line" aria-hidden />
              <span className="font-mono text-[12px] tabular-nums shrink-0">
                <span className={over ? "text-destructive" : "text-foreground"}>
                  {formatCents(r.spentCents)}
                </span>
                {r.budgetCents > 0 ? (
                  <span className="text-muted-foreground">
                    {" / "}
                    {formatCents(r.budgetCents)}
                  </span>
                ) : (
                  <span className="text-muted-foreground"> · tracking only</span>
                )}
              </span>
            </div>
            <div className="relative h-1 rounded-full bg-muted overflow-hidden">
              {pct != null ? (
                <div
                  className="absolute inset-y-0 left-0 transition-all"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: over ? "var(--destructive)" : r.color,
                  }}
                />
              ) : (
                <div
                  className="absolute inset-y-0 left-0"
                  style={{
                    width: r.spentCents > 0 ? "100%" : "0%",
                    backgroundColor: r.color,
                    opacity: 0.35,
                  }}
                />
              )}
            </div>
            {over ? (
              <p className="font-mono text-[10px] text-destructive tracking-wide">
                ↑ {formatCents(overage)} over allowance
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
