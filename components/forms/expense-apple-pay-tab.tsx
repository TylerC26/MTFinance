"use client";

import * as React from "react";
import { SmartphoneIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { parseExpensesFromApplePay } from "@/app/(dashboard)/expenses/ai-actions";
import { bulkInsertExpenses } from "@/app/(dashboard)/expenses/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { todayIso } from "@/lib/dates";
import type { Category } from "./expense-form";
import { fileToBase64 } from "./file-to-base64";
import { FileDropButton } from "./file-drop-button";
import { PayerSelector } from "./payer-selector";
import {
  AccountSelector,
  ownerToAccountId,
  type AccountOption,
} from "./account-selector";

type Row = {
  occurredOn: string;
  amount: string;
  categoryId: string;
  accountId: string;
  payer: string;
  description: string;
};

function draftToRow(
  d: {
    occurredOn: string;
    amount: number;
    categoryId: number | null;
    payer: string | null;
    description: string;
  },
  accounts: AccountOption[],
): Row {
  const payer = d.payer ?? "";
  return {
    occurredOn: d.occurredOn || todayIso(),
    amount: d.amount > 0 ? d.amount.toFixed(2) : "",
    categoryId: d.categoryId != null ? String(d.categoryId) : "",
    accountId: ownerToAccountId(payer, accounts),
    payer,
    description: d.description ?? "",
  };
}

export function ExpenseApplePayTab({
  categories,
  accounts,
  onSaved,
}: {
  categories: Category[];
  accounts: AccountOption[];
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
      setRows(res.drafts.map((d) => draftToRow(d, accounts)));
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

  const loadSamples = () => {
    const merchants = [
      "Whole Foods",
      "Shell gas station",
      "Starbucks",
      "Uber",
      "Netflix",
      "Trader Joe's",
      "Amazon",
      "Chipotle",
      "CVS Pharmacy",
      "Apple Store",
    ];
    const payers = ["tyler", "wife", "joint"];
    const today = new Date();
    const samples: Row[] = merchants.map((m, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const amount = (Math.random() * 90 + 5).toFixed(2);
      const cat = categories[i % Math.max(categories.length, 1)];
      const payer = payers[i % payers.length];
      return {
        occurredOn: d.toISOString().slice(0, 10),
        amount,
        categoryId: cat ? String(cat.id) : "",
        accountId: ownerToAccountId(payer, accounts),
        payer,
        description: m,
      };
    });
    setRows(samples);
  };

  const onSaveAll = async () => {
    if (!rows || rows.length === 0) return;
    const payload = rows.map((r) => ({
      occurredOn: r.occurredOn,
      amount: Number(r.amount),
      categoryId: r.categoryId === "" ? null : Number(r.categoryId),
      accountId: r.accountId === "" ? null : Number(r.accountId),
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
          <>
            <p className="text-xs text-muted-foreground">
              We&rsquo;ll extract every transaction; you can review and edit before saving.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={loadSamples}
              className="self-start"
            >
              Load 10 sample entries
            </Button>
          </>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {rows.length} {rows.length === 1 ? "transaction" : "transactions"} — review and edit, then save.
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
      <div className="flex flex-col gap-2">
        {rows.map((row, i) => (
          <Card key={i} size="sm">
            <CardContent className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <div className="relative min-w-0 flex-1">
                  <span className="pointer-events-none absolute left-1 top-1/2 -translate-y-1/2 font-mono text-lg text-muted-foreground">
                    $
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    inputMode="decimal"
                    value={row.amount}
                    onChange={(e) => updateRow(i, { amount: e.target.value })}
                    placeholder="0.00"
                    aria-label="Amount"
                    className="h-9 border-0 bg-transparent pl-5 font-mono text-2xl font-semibold tabular-nums shadow-none focus-visible:ring-0"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Remove transaction"
                  onClick={() => removeRow(i)}
                >
                  <Trash2Icon />
                </Button>
              </div>
              <Input
                value={row.description}
                onChange={(e) => updateRow(i, { description: e.target.value })}
                placeholder="What was this for?"
                aria-label="Description"
                className="h-8"
              />
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={row.occurredOn}
                  onChange={(e) => updateRow(i, { occurredOn: e.target.value })}
                  aria-label="Date"
                  className="h-8 w-auto flex-none"
                />
                <Select
                  value={row.categoryId}
                  onValueChange={(v) => updateRow(i, { categoryId: v ?? "" })}
                >
                  <SelectTrigger aria-label="Category" className="h-8 w-full flex-1">
                    <SelectValue placeholder="Uncategorized">
                      {(value: string | null) => {
                        if (!value) return "Uncategorized";
                        const c = categories.find((c) => String(c.id) === value);
                        return c?.name ?? "Uncategorized";
                      }}
                    </SelectValue>
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
              </div>
              <PayerSelector
                value={row.payer}
                onChange={(v) =>
                  updateRow(i, {
                    payer: v,
                    accountId: ownerToAccountId(v, accounts),
                  })
                }
                size="sm"
              />
              <AccountSelector
                value={row.accountId}
                onChange={(v) => updateRow(i, { accountId: v })}
                accounts={accounts}
                size="sm"
              />
            </CardContent>
          </Card>
        ))}
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
