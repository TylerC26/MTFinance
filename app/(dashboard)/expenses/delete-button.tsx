"use client";

import * as React from "react";
import { toast } from "sonner";
import { deleteExpense } from "./actions";
import { Button } from "@/components/ui/button";

export function DeleteExpenseButton({
  id,
  children,
}: {
  id: number;
  children: React.ReactNode;
}) {
  const [pending, setPending] = React.useState(false);
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Delete"
      disabled={pending}
      onClick={async () => {
        if (!confirm("Delete this expense?")) return;
        setPending(true);
        try {
          await deleteExpense(id);
          toast.success("Expense deleted");
        } finally {
          setPending(false);
        }
      }}
    >
      {children}
    </Button>
  );
}
