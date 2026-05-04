"use client";

import * as React from "react";
import { toast } from "sonner";
import { deleteBill } from "./actions";
import { Button } from "@/components/ui/button";

export function DeleteBillButton({
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
        if (!confirm("Delete this bill and its payment history?")) return;
        setPending(true);
        try {
          await deleteBill(id);
          toast.success("Bill deleted");
        } finally {
          setPending(false);
        }
      }}
    >
      {children}
    </Button>
  );
}
