import Link from "next/link";
import { formatCents } from "@/lib/money";
import type { AccountBalance } from "@/lib/db/queries/account-balance";

const OWNER_LABEL: Record<string, string> = {
  tyler: "Tyler",
  wife: "Michelle",
  joint: "Joint",
};

export function CashOnHandPanel({ balances }: { balances: AccountBalance[] }) {
  if (balances.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground font-mono">
        — no cash accounts —
      </div>
    );
  }

  const sorted = [...balances].sort((a, b) => b.balanceCents - a.balanceCents);

  return (
    <ul className="flex-1 flex flex-col divide-y divide-dashed divide-border -my-2">
      {sorted.map((b) => (
        <li key={b.id} className="py-2.5 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-sm truncate">{b.name}</div>
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground mt-0.5">
              {OWNER_LABEL[b.owner] ?? b.owner}
            </div>
          </div>
          <span
            className="font-mono text-sm tabular-nums shrink-0"
            data-numeric
          >
            {formatCents(b.balanceCents)}
          </span>
        </li>
      ))}
      <li className="py-2 mt-auto">
        <Link
          href="/accounts"
          className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent hover:underline underline-offset-4"
        >
          → view all
        </Link>
      </li>
    </ul>
  );
}
