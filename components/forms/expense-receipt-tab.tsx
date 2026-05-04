"use client";

import * as React from "react";
import { CameraIcon } from "lucide-react";
import { toast } from "sonner";
import { parseExpenseFromReceipt } from "@/app/(dashboard)/expenses/ai-actions";
import type { Category, ExpenseDefaults } from "./expense-form";
import { fileToBase64 } from "./file-to-base64";
import { FileDropButton } from "./file-drop-button";

export function ExpenseReceiptTab({
  categories,
  onPrefill,
}: {
  categories: Category[];
  onPrefill: (d: ExpenseDefaults) => void;
}) {
  const [pending, setPending] = React.useState(false);
  const [fileName, setFileName] = React.useState<string | null>(null);

  const handleFile = async (file: File) => {
    setPending(true);
    setFileName(file.name);
    try {
      const { base64, mediaType } = await fileToBase64(file);
      const res = await parseExpenseFromReceipt(base64, mediaType, categories);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      onPrefill({
        occurredOn: res.draft.occurredOn,
        amount: res.draft.amount,
        categoryId: res.draft.categoryId,
        payer: res.draft.payer,
        description: res.draft.description,
      });
      toast.success("Receipt parsed — review and save");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to read image");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <FileDropButton
        id="receipt-file"
        icon={CameraIcon}
        label={pending ? "Reading…" : "Tap to take or upload a receipt"}
        hint="JPEG, PNG, WebP, or GIF"
        capture="environment"
        disabled={pending}
        onFile={(f) => void handleFile(f)}
      />
      {fileName && !pending ? (
        <p className="text-xs text-muted-foreground">{fileName}</p>
      ) : null}
      <p className="text-xs text-muted-foreground">
        Once parsed, you&rsquo;ll land on the Manual tab to review before saving.
      </p>
    </div>
  );
}
