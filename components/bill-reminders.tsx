import Link from "next/link";
import { CheckCircleIcon, ZapIcon } from "lucide-react";
import { formatCents } from "@/lib/money";
import { currentYearMonth } from "@/lib/dates";

type Row = {
  bill: {
    id: number;
    name: string;
    amountCents: number;
    dueDay: number;
    autopay: boolean;
  };
  payment: { id: number } | null;
};

export function BillReminders({
  rows,
  yearMonth,
}: {
  rows: Row[];
  yearMonth: string;
}) {
  const isCurrentMonth = yearMonth === currentYearMonth();
  const today = new Date().getDate();
  const unpaid = rows.filter((r) => !r.payment);

  // Sort: overdue first, then by closest due day
  const sorted = [...unpaid].sort((a, b) => {
    if (!isCurrentMonth) return a.bill.dueDay - b.bill.dueDay;
    const aDelta = a.bill.dueDay - today;
    const bDelta = b.bill.dueDay - today;
    const aOver = aDelta < 0;
    const bOver = bDelta < 0;
    if (aOver !== bOver) return aOver ? -1 : 1;
    return Math.abs(aDelta) - Math.abs(bDelta);
  });

  if (unpaid.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-4">
        <CheckCircleIcon className="size-7 text-positive" strokeWidth={1.4} />
        <div>
          <p className="font-display text-base tracking-tight">All settled</p>
          <p className="font-mono text-[11px] text-muted-foreground tracking-wide mt-1">
            {rows.length} bill{rows.length === 1 ? "" : "s"} paid for the
            month.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ul className="flex-1 flex flex-col divide-y divide-dashed divide-border -my-2">
      {sorted.slice(0, 6).map(({ bill }) => {
        const delta = bill.dueDay - today;
        let status: { label: string; tone: "danger" | "warn" | "neutral" };
        if (!isCurrentMonth) {
          status = { label: `day ${bill.dueDay}`, tone: "neutral" };
        } else if (delta < 0) {
          status = { label: `${Math.abs(delta)}d overdue`, tone: "danger" };
        } else if (delta === 0) {
          status = { label: "due today", tone: "danger" };
        } else if (delta <= 3) {
          status = { label: `in ${delta}d`, tone: "warn" };
        } else {
          status = { label: `in ${delta}d`, tone: "neutral" };
        }

        return (
          <li key={bill.id} className="py-2.5 flex items-center gap-3">
            <span className="font-mono text-base tabular-nums text-muted-foreground w-7 text-center">
              {bill.dueDay.toString().padStart(2, "0")}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm truncate">{bill.name}</span>
                {bill.autopay ? (
                  <ZapIcon
                    className="size-3 text-accent shrink-0"
                    aria-label="autopay"
                  />
                ) : null}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-[11px] tabular-nums text-foreground">
                  {formatCents(bill.amountCents)}
                </span>
                <span
                  className={
                    "font-mono text-[10px] uppercase tracking-[0.14em] " +
                    (status.tone === "danger"
                      ? "text-destructive"
                      : status.tone === "warn"
                        ? "text-warning"
                        : "text-muted-foreground")
                  }
                >
                  · {status.label}
                </span>
              </div>
            </div>
          </li>
        );
      })}
      {sorted.length > 6 ? (
        <li className="py-2 mt-auto">
          <Link
            href={`/bills?month=${yearMonth}`}
            className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent hover:underline underline-offset-4"
          >
            → {sorted.length - 6} more
          </Link>
        </li>
      ) : null}
    </ul>
  );
}
