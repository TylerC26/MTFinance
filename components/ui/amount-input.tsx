import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

type Props = Omit<
  React.ComponentProps<typeof Input>,
  "type" | "inputMode" | "step" | "min"
>;

export function AmountInput({ className, ...props }: Props) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 font-mono text-4xl text-muted-foreground">
        $
      </span>
      <Input
        type="number"
        step="0.01"
        min="0"
        inputMode="decimal"
        className={cn(
          "h-20! border-0! bg-transparent! pl-12 font-mono text-6xl! font-semibold tabular-nums shadow-none! ring-0! focus-visible:border-0! focus-visible:ring-0! md:text-6xl!",
          className,
        )}
        {...props}
      />
    </div>
  );
}
