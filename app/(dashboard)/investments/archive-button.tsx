"use client";

import * as React from "react";
import { toast } from "sonner";
import { archiveAccount } from "./actions";
import { Button } from "@/components/ui/button";

export function ArchiveAccountButton({
  id,
  archived,
  children,
}: {
  id: number;
  archived: boolean;
  children: React.ReactNode;
}) {
  const [pending, setPending] = React.useState(false);
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={archived ? "Unarchive" : "Archive"}
      disabled={pending}
      onClick={async () => {
        setPending(true);
        try {
          await archiveAccount(id, !archived);
          toast.success(archived ? "Restored" : "Archived");
        } finally {
          setPending(false);
        }
      }}
    >
      {children}
    </Button>
  );
}
