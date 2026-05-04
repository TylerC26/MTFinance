"use client";

import * as React from "react";
import { toast } from "sonner";
import { Trash2Icon } from "lucide-react";
import { deleteBalance } from "./actions";
import { Button } from "@/components/ui/button";

export function DeleteBalanceButton({ id }: { id: number }) {
  const [pending, setPending] = React.useState(false);
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Delete balance"
      disabled={pending}
      onClick={async () => {
        if (!confirm("Delete this balance entry?")) return;
        setPending(true);
        try {
          await deleteBalance(id);
          toast.success("Balance deleted");
        } finally {
          setPending(false);
        }
      }}
    >
      <Trash2Icon />
    </Button>
  );
}
