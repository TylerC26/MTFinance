"use client";

import * as React from "react";
import {
  ArrowLeftIcon,
  PencilIcon,
  ReceiptIcon,
  SmartphoneIcon,
  SparklesIcon,
  type LucideIcon,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { deleteExpense, upsertExpense } from "@/app/(dashboard)/expenses/actions";
import { Input } from "@/components/ui/input";
import { AmountInput } from "@/components/ui/amount-input";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { todayIso } from "@/lib/dates";
import { ExpenseTextTab } from "./expense-text-tab";
import { ExpenseReceiptTab } from "./expense-receipt-tab";
import { ExpenseApplePayTab } from "./expense-apple-pay-tab";
import { PayerSelector } from "./payer-selector";
import { CategorySelector } from "./category-selector";
import {
  AccountSelector,
  ownerToAccountId,
  type AccountOption,
} from "./account-selector";

export type Category = { id: number; name: string };

export type ExpenseDefaults = {
  id?: number;
  occurredOn?: string;
  amount?: number;
  categoryId?: number | null;
  accountId?: number | null;
  payer?: string | null;
  description?: string;
};

type Values = {
  occurredOn: string;
  amount: number;
  categoryId: string;
  accountId: string;
  payer: string;
  description: string;
};

type Step = "select" | "manual" | "text" | "receipt" | "apple-pay";

const methods: {
  key: Exclude<Step, "select">;
  label: string;
  desc: string;
  icon: LucideIcon;
}[] = [
  { key: "manual", label: "Manual", desc: "Fill in each field by hand", icon: PencilIcon },
  { key: "text", label: "Quick text", desc: '"208 dinner" → AI fills the form', icon: SparklesIcon },
  { key: "receipt", label: "Receipt photo", desc: "Snap a receipt; AI reads it", icon: ReceiptIcon },
  { key: "apple-pay", label: "Apple Pay", desc: "Screenshot many at once", icon: SmartphoneIcon },
];

const titles: Record<Exclude<Step, "select">, string> = {
  manual: "Log expense — manual",
  text: "Log expense — quick text",
  receipt: "Log expense — receipt",
  "apple-pay": "Log expenses — Apple Pay",
};

function defaultValues(d?: ExpenseDefaults): Values {
  return {
    occurredOn: d?.occurredOn ?? todayIso(),
    amount: d?.amount ?? 0,
    categoryId: d?.categoryId != null ? String(d.categoryId) : "",
    accountId: d?.accountId != null ? String(d.accountId) : "",
    payer: d?.payer ?? "",
    description: d?.description ?? "",
  };
}

function ManualExpenseForm({
  categories,
  accounts,
  defaults,
  onSuccess,
}: {
  categories: Category[];
  accounts: AccountOption[];
  defaults?: ExpenseDefaults;
  onSuccess: () => void;
}) {
  const isEdit = Boolean(defaults?.id);
  const form = useForm<Values>({ defaultValues: defaultValues(defaults) });

  React.useEffect(() => {
    form.reset(defaultValues(defaults));
  }, [defaults, form]);

  const watchedPayer = form.watch("payer");
  const watchedAccountId = form.watch("accountId");
  React.useEffect(() => {
    if (!watchedAccountId && watchedPayer) {
      const id = ownerToAccountId(watchedPayer, accounts);
      if (id) form.setValue("accountId", id);
    }
  }, [watchedPayer, watchedAccountId, accounts, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    const res = await upsertExpense({
      ...values,
      id: defaults?.id,
      categoryId: values.categoryId === "" ? null : Number(values.categoryId),
      accountId: values.accountId === "" ? null : Number(values.accountId),
      payer: values.payer || null,
    });
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(isEdit ? "Expense updated" : "Expense logged");
    onSuccess();
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <FormField
        id="amount"
        label="Amount"
        error={form.formState.errors.amount?.message}
      >
        <AmountInput
          id="amount"
          autoFocus
          {...form.register("amount", {
            valueAsNumber: true,
            required: "Required",
            min: { value: 0.01, message: "Must be > 0" },
          })}
        />
      </FormField>
      <FormField id="description" label="Description">
        <input
          id="description"
          placeholder="dinner"
          className="block w-full border-0 border-b border-input bg-transparent px-0 py-2 text-2xl outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-foreground"
          {...form.register("description")}
        />
      </FormField>
      <FormField id="occurredOn" label="Date">
        <Input
          id="occurredOn"
          type="date"
          className="w-fit"
          {...form.register("occurredOn", { required: true })}
        />
      </FormField>
      <FormField id="categoryId" label="Category">
        <CategorySelector
          value={form.watch("categoryId")}
          onChange={(v) => form.setValue("categoryId", v)}
          categories={categories}
        />
      </FormField>
      <FormField id="payer" label="Paid by">
        <PayerSelector
          value={form.watch("payer")}
          onChange={(v) => {
            form.setValue("payer", v);
            const id = ownerToAccountId(v, accounts);
            if (id) form.setValue("accountId", id);
          }}
        />
      </FormField>
      <FormField id="accountId" label="Account">
        <AccountSelector
          value={form.watch("accountId")}
          onChange={(v) => form.setValue("accountId", v)}
          accounts={accounts}
        />
      </FormField>
      <DialogFooter className={isEdit ? "sm:justify-between" : undefined}>
        {isEdit ? (
          <Button
            type="button"
            variant="ghost"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            disabled={form.formState.isSubmitting}
            onClick={async () => {
              if (!defaults?.id) return;
              if (!confirm("Delete this expense?")) return;
              await deleteExpense(defaults.id);
              toast.success("Expense deleted");
              onSuccess();
            }}
          >
            Delete
          </Button>
        ) : null}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:gap-2">
          <DialogClose render={<Button type="button" variant="outline">Cancel</Button>} />
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {isEdit ? "Save" : "Log expense"}
          </Button>
        </div>
      </DialogFooter>
    </form>
  );
}

function MethodSelector({ onPick }: { onPick: (s: Exclude<Step, "select">) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {methods.map((m) => {
        const Icon = m.icon;
        return (
          <button
            key={m.key}
            type="button"
            onClick={() => onPick(m.key)}
            className="group flex flex-col items-start gap-2 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-foreground/30 hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <Icon className="size-5 text-muted-foreground group-hover:text-foreground" />
            <div className="text-sm font-medium">{m.label}</div>
            <p className="text-xs text-muted-foreground">{m.desc}</p>
          </button>
        );
      })}
    </div>
  );
}

export function ExpenseFormDialog({
  trigger,
  categories,
  accounts,
  defaults,
}: {
  trigger: React.ReactNode;
  categories: Category[];
  accounts: AccountOption[];
  defaults?: ExpenseDefaults;
}) {
  const [open, setOpen] = React.useState(false);
  const isEdit = Boolean(defaults?.id);
  const [step, setStep] = React.useState<Step>(isEdit ? "manual" : "select");
  const [manualDefaults, setManualDefaults] = React.useState<ExpenseDefaults | undefined>(
    defaults,
  );

  const onOpenChange = React.useCallback(
    (next: boolean) => {
      setOpen(next);
      if (next) {
        setStep(isEdit ? "manual" : "select");
        setManualDefaults(defaults);
      }
    },
    [defaults, isEdit],
  );

  const prefillManual = React.useCallback((d: ExpenseDefaults) => {
    setManualDefaults(d);
    setStep("manual");
  }, []);

  const close = React.useCallback(() => setOpen(false), []);
  const goBack = React.useCallback(() => setStep("select"), []);

  const showBack = !isEdit && step !== "select";
  const title =
    step === "select" ? "Log expense" : titles[step as Exclude<Step, "select">];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent
        className={
          step === "apple-pay"
            ? "sm:max-w-2xl max-h-[90vh] overflow-y-auto"
            : step === "select"
              ? "sm:max-w-2xl"
              : undefined
        }
      >
        <DialogHeader>
          <div className="flex items-center gap-2">
            {showBack ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Back"
                onClick={goBack}
              >
                <ArrowLeftIcon />
              </Button>
            ) : null}
            <DialogTitle>{title}</DialogTitle>
          </div>
        </DialogHeader>
        {step === "select" ? (
          <MethodSelector onPick={setStep} />
        ) : step === "manual" ? (
          <ManualExpenseForm
            categories={categories}
            accounts={accounts}
            defaults={isEdit ? defaults : manualDefaults}
            onSuccess={close}
          />
        ) : step === "text" ? (
          <ExpenseTextTab categories={categories} onPrefill={prefillManual} />
        ) : step === "receipt" ? (
          <ExpenseReceiptTab categories={categories} onPrefill={prefillManual} />
        ) : (
          <ExpenseApplePayTab
            categories={categories}
            accounts={accounts}
            onSaved={close}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
