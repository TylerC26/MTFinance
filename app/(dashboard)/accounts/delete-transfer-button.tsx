"use client";

import * as React from "react";
import { toast } from "sonner";
import { Trash2Icon } from "lucide-react";
import { deleteTransfer } from "./actions";
import { Button } from "@/components/ui/button";

export function DeleteTransferButton({ id }: { id: number }) {
  const [pending, setPending] = React.useState(false);
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Delete transfer"
      disabled={pending}
      onClick={async () => {
        if (!confirm("Delete this transfer?")) return;
        setPending(true);
        try {
          await deleteTransfer(id);
          toast.success("Transfer deleted");
        } finally {
          setPending(false);
        }
      }}
    >
      <Trash2Icon />
    </Button>
  );
}
