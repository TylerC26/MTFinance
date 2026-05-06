"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { upsertIncome } from "@/app/(dashboard)/income/actions";
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
import { currentYearMonth } from "@/lib/dates";
import { PayerSelector } from "./payer-selector";
import {
  AccountSelector,
  ownerToAccountId,
  type AccountOption,
} from "./account-selector";

type Defaults = {
  id?: number;
  name?: string;
  amount?: number;
  payer?: "tyler" | "wife" | "joint";
  accountId?: number | null;
  startMonth?: string;
  endMonth?: string | null;
  notes?: string;
};

type Values = {
  name: string;
  amount: number;
  payer: "tyler" | "wife" | "joint";
  accountId: string;
  startMonth: string;
  endMonth: string;
  notes: string;
};

export function IncomeFormDialog({
  trigger,
  accounts,
  defaults,
}: {
  trigger: React.ReactNode;
  accounts: AccountOption[];
  defaults?: Defaults;
}) {
  const [open, setOpen] = React.useState(false);
  const isEdit = Boolean(defaults?.id);
  const initialAccountId = (d: Defaults | undefined): string => {
    if (d?.accountId != null) return String(d.accountId);
    return ownerToAccountId(d?.payer ?? "joint", accounts);
  };
  const form = useForm<Values>({
    defaultValues: {
      name: defaults?.name ?? "",
      amount: defaults?.amount ?? (undefined as unknown as number),
      payer: defaults?.payer ?? "joint",
      accountId: initialAccountId(defaults),
      startMonth: defaults?.startMonth ?? currentYearMonth(),
      endMonth: defaults?.endMonth ?? "",
      notes: defaults?.notes ?? "",
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        name: defaults?.name ?? "",
        amount: defaults?.amount ?? (undefined as unknown as number),
        payer: defaults?.payer ?? "joint",
        accountId: initialAccountId(defaults),
        startMonth: defaults?.startMonth ?? currentYearMonth(),
        endMonth: defaults?.endMonth ?? "",
        notes: defaults?.notes ?? "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaults, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    const res = await upsertIncome({
      ...values,
      id: defaults?.id,
      accountId: values.accountId === "" ? null : Number(values.accountId),
    });
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(isEdit ? "Income updated" : "Income added");
    setOpen(false);
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit income source" : "New income source"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <FormField
            id="name"
            label="Name"
            error={form.formState.errors.name?.message}
          >
            <Input
              id="name"
              autoFocus
              placeholder="e.g. Tyler salary"
              {...form.register("name", { required: "Required" })}
            />
          </FormField>
          <FormField id="amount" label="Monthly amount" hint="Net, in dollars">
            <AmountInput
              id="amount"
              {...form.register("amount", {
                valueAsNumber: true,
                required: true,
              })}
            />
          </FormField>
          <FormField id="payer" label="Earner">
            <PayerSelector
              value={form.watch("payer")}
              onChange={(v) => {
                const next = (v || "joint") as Values["payer"];
                form.setValue("payer", next);
                const id = ownerToAccountId(next, accounts);
                if (id) form.setValue("accountId", id);
              }}
            />
          </FormField>
          <FormField id="accountId" label="Deposit account">
            <AccountSelector
              value={form.watch("accountId")}
              onChange={(v) => form.setValue("accountId", v)}
              accounts={accounts}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField id="startMonth" label="Starts" hint="YYYY-MM">
              <Input
                id="startMonth"
                type="month"
                className="w-3/5"
                {...form.register("startMonth", { required: true })}
              />
            </FormField>
            <FormField id="endMonth" label="Ends" hint="Optional">
              <Input
                id="endMonth"
                type="month"
                className="w-3/5"
                {...form.register("endMonth")}
              />
            </FormField>
          </div>
          <FormField id="notes" label="Notes">
            <Input id="notes" {...form.register("notes")} />
          </FormField>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline">Cancel</Button>} />
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {isEdit ? "Save" : "Add income"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
