"use client";

import * as React from "react";
import { toast } from "sonner";
import { setBillPaid } from "./actions";
import { CheckIcon, CircleIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function PaidToggle({
  billId,
  yearMonth,
  amountCents,
  paid,
  className,
}: {
  billId: number;
  yearMonth: string;
  amountCents: number;
  paid: boolean;
  className?: string;
}) {
  const [pending, startTransition] = React.useTransition();
  const [optimisticPaid, setOptimisticPaid] = React.useOptimistic(paid);
  const display = optimisticPaid;

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        const next = !display;
        startTransition(async () => {
          setOptimisticPaid(next);
          try {
            await setBillPaid(billId, yearMonth, next, amountCents);
            toast.success(next ? "Marked paid" : "Marked unpaid");
          } catch {
            toast.error("Failed to update");
          }
        });
      }}
      className={cn(
        "inline-flex items-center justify-center gap-2 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors border-b border-dashed",
        display
          ? "text-positive border-positive/40 hover:border-positive"
          : "text-muted-foreground border-border hover:text-foreground hover:border-foreground/40",
        className,
      )}
    >
      {display ? (
        <CheckIcon className="size-3" />
      ) : (
        <CircleIcon className="size-3" />
      )}
      {display ? "settled" : "due"}
    </button>
  );
}
