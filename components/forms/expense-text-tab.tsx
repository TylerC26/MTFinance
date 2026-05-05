"use client";

import * as React from "react";
import { toast } from "sonner";
import { parseExpenseFromText } from "@/app/(dashboard)/expenses/ai-actions";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import type { Category, ExpenseDefaults } from "./expense-form";

export function ExpenseTextTab({
  categories,
  onPrefill,
}: {
  categories: Category[];
  onPrefill: (d: ExpenseDefaults) => void;
}) {
  const [text, setText] = React.useState("");
  const [pending, setPending] = React.useState(false);

  const onParse = async () => {
    setPending(true);
    try {
      const res = await parseExpenseFromText(text, categories);
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
      toast.success("Parsed — review and save");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <FormField
        id="quick-text"
        label="Describe the expense"
        hint='e.g. "208 dinner" or "yesterday 45 uber michelle paid"'
      >
        <textarea
          id="quick-text"
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="208 dinner"
          autoFocus
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </FormField>
      <div className="flex justify-end">
        <Button type="button" onClick={onParse} disabled={pending || !text.trim()}>
          {pending ? "Parsing…" : "Parse"}
        </Button>
      </div>
    </div>
  );
}
