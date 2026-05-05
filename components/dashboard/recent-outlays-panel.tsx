import Link from "next/link";
import { format } from "date-fns";
import { formatCents } from "@/lib/money";

type Row = {
  expense: {
    id: number;
    occurredOn: string;
    description: string | null;
    amountCents: number;
  };
  category: {
    name: string;
    color: string;
  } | null;
};

export function RecentOutlaysPanel({
  rows,
  yearMonth,
  limit = 6,
}: {
  rows: Row[];
  yearMonth: string;
  limit?: number;
}) {
  if (rows.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground font-mono">
        — no expenses logged this month —
      </div>
    );
  }

  const visible = rows.slice(0, limit);
  const remaining = rows.length - visible.length;

  return (
    <ul className="flex-1 flex flex-col divide-y divide-dashed divide-border -my-2">
      {visible.map(({ expense, category }) => (
        <li key={expense.id} className="py-2.5 flex items-center gap-3">
          <span className="font-mono text-[11px] tabular-nums text-muted-foreground shrink-0 w-12">
            {format(new Date(expense.occurredOn), "MMM d").toLowerCase()}
          </span>
          <span
            aria-hidden
            className="size-2 rounded-full shrink-0"
            style={{ background: category?.color ?? "#94a3b8" }}
          />
          <div className="flex-1 min-w-0">
            <div className="text-sm truncate">
              {expense.description?.trim() || category?.name || "Uncategorized"}
            </div>
            {expense.description && category ? (
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground mt-0.5 truncate">
                {category.name}
              </div>
            ) : null}
          </div>
          <span
            className="font-mono text-sm tabular-nums shrink-0"
            data-numeric
          >
            {formatCents(expense.amountCents)}
          </span>
        </li>
      ))}
      <li className="py-2 mt-auto">
        <Link
          href={`/expenses?month=${yearMonth}`}
          className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent hover:underline underline-offset-4"
        >
          → {remaining > 0 ? `${remaining} more` : "view all"}
        </Link>
      </li>
    </ul>
  );
}
