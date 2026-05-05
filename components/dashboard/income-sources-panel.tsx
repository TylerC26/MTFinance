import Link from "next/link";
import { formatCents } from "@/lib/money";

const PAYER_LABEL: Record<string, string> = {
  tyler: "Tyler",
  wife: "Michelle",
  joint: "Joint",
};

type Source = {
  id: number;
  name: string;
  amountCents: number;
  payer: string;
};

export function IncomeSourcesPanel({
  sources,
  yearMonth,
  limit = 6,
}: {
  sources: Source[];
  yearMonth: string;
  limit?: number;
}) {
  if (sources.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground font-mono">
        — no active income sources —
      </div>
    );
  }

  const sorted = [...sources].sort((a, b) => b.amountCents - a.amountCents);
  const visible = sorted.slice(0, limit);
  const remaining = sorted.length - visible.length;

  return (
    <ul className="flex-1 flex flex-col divide-y divide-dashed divide-border -my-2">
      {visible.map((s) => (
        <li key={s.id} className="py-2.5 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-sm truncate">{s.name}</div>
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground mt-0.5">
              {PAYER_LABEL[s.payer] ?? s.payer}
            </div>
          </div>
          <span
            className="font-mono text-sm tabular-nums text-positive shrink-0"
            data-numeric
          >
            {formatCents(s.amountCents)}
          </span>
        </li>
      ))}
      <li className="py-2 mt-auto">
        <Link
          href={`/income?month=${yearMonth}`}
          className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent hover:underline underline-offset-4"
        >
          → {remaining > 0 ? `${remaining} more` : "view all"}
        </Link>
      </li>
    </ul>
  );
}
