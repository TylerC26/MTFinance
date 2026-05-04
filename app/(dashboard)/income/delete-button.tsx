"use client";

import * as React from "react";
import { toast } from "sonner";
import { deleteIncome } from "./actions";
import { Button } from "@/components/ui/button";

export function DeleteIncomeButton({
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
        if (!confirm("Delete this income source? Any historic months will lose this entry.")) return;
        setPending(true);
        try {
          await deleteIncome(id);
          toast.success("Income deleted");
        } finally {
          setPending(false);
        }
      }}
    >
      {children}
    </Button>
  );
}
