"use client";

import * as React from "react";
import { SmartphoneIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { parseExpensesFromApplePay } from "@/app/(dashboard)/expenses/ai-actions";
import { bulkInsertExpenses } from "@/app/(dashboard)/expenses/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { todayIso } from "@/lib/dates";
import type { Category } from "./expense-form";
import { fileToBase64 } from "./file-to-base64";
import { FileDropButton } from "./file-drop-button";
import { PayerSelector } from "./payer-selector";

type Row = {
  occurredOn: string;
  amount: string;
  categoryId: string;
  payer: string;
  description: string;
};

function draftToRow(d: {
  occurredOn: string;
  amount: number;
  categoryId: number | null;
  payer: string | null;
  description: string;
}): Row {
  return {
    occurredOn: d.occurredOn || todayIso(),
    amount: d.amount > 0 ? d.amount.toFixed(2) : "",
    categoryId: d.categoryId != null ? String(d.categoryId) : "",
    payer: d.payer ?? "",
    description: d.description ?? "",
  };
}

export function ExpenseApplePayTab({
  categories,
  onSaved,
}: {
  categories: Category[];
  onSaved: () => void;
}) {
  const [pending, setPending] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [rows, setRows] = React.useState<Row[] | null>(null);

  const handleFile = async (file: File) => {
    setPending(true);
    setRows(null);
    try {
      const { base64, mediaType } = await fileToBase64(file);
      const res = await parseExpensesFromApplePay(base64, mediaType, categories);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setRows(res.drafts.map(draftToRow));
      toast.success(`Found ${res.drafts.length} ${res.drafts.length === 1 ? "transaction" : "transactions"}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to read image");
    } finally {
      setPending(false);
    }
  };

  const updateRow = (i: number, patch: Partial<Row>) => {
    setRows((prev) => {
      if (!prev) return prev;
      const next = prev.slice();
      next[i] = { ...next[i], ...patch };
      return next;
    });
  };

  const removeRow = (i: number) => {
    setRows((prev) => (prev ? prev.filter((_, idx) => idx !== i) : prev));
  };

  const onSaveAll = async () => {
    if (!rows || rows.length === 0) return;
    const payload = rows.map((r) => ({
      occurredOn: r.occurredOn,
      amount: Number(r.amount),
      categoryId: r.categoryId === "" ? null : Number(r.categoryId),
      payer: r.payer || null,
      description: r.description,
    }));
    setSaving(true);
    try {
      const res = await bulkInsertExpenses(payload);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`Logged ${res.count} ${res.count === 1 ? "expense" : "expenses"}`);
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  if (!rows) {
    return (
      <div className="flex flex-col gap-4">
        <FileDropButton
          id="applepay-file"
          icon={SmartphoneIcon}
          label={pending ? "Extracting transactions…" : "Upload an Apple Pay screenshot"}
          hint="A screenshot showing the list of transactions."
          disabled={pending}
          onFile={(f) => void handleFile(f)}
        />
        {!pending ? (
          <p className="text-xs text-muted-foreground">
            We&rsquo;ll extract every transaction; you can review and edit before saving.
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {rows.length} {rows.length === 1 ? "row" : "rows"} — edit any field, then save.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setRows(null)}
        >
          Upload different screenshot
        </Button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow className="border-border bg-muted/40">
              <TableHead className="w-32">Date</TableHead>
              <TableHead className="w-24 text-right">Amount</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-40">Category</TableHead>
              <TableHead className="w-56">Paid by</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, i) => (
              <TableRow key={i} className="border-border">
                <TableCell>
                  <Input
                    type="date"
                    value={row.occurredOn}
                    onChange={(e) => updateRow(i, { occurredOn: e.target.value })}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    inputMode="decimal"
                    value={row.amount}
                    onChange={(e) => updateRow(i, { amount: e.target.value })}
                    className="text-right font-mono"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={row.description}
                    onChange={(e) => updateRow(i, { description: e.target.value })}
                  />
                </TableCell>
                <TableCell>
                  <Select
                    value={row.categoryId}
                    onValueChange={(v) => updateRow(i, { categoryId: v ?? "" })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Uncategorized" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Uncategorized</SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <PayerSelector
                    value={row.payer}
                    onChange={(v) => updateRow(i, { payer: v })}
                    size="sm"
                  />
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Remove row"
                    onClick={() => removeRow(i)}
                  >
                    <Trash2Icon />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => setRows(null)}>
          Cancel
        </Button>
        <Button
          type="button"
          onClick={onSaveAll}
          disabled={saving || rows.length === 0}
        >
          {saving ? "Saving…" : `Save ${rows.length}`}
        </Button>
      </div>
    </div>
  );
}
