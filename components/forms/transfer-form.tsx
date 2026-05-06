"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { logTransfer } from "@/app/(dashboard)/accounts/actions";
import { Input } from "@/components/ui/input";
import { AmountInput } from "@/components/ui/amount-input";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import type { AccountOption } from "./account-selector";

export type TransferDefaults = {
  id?: number;
  fromAccountId?: number;
  toAccountId?: number;
  amount?: number;
  occurredOn?: string;
  notes?: string;
};

type Values = {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  occurredOn: string;
  notes: string;
};

export function TransferFormDialog({
  trigger,
  accounts,
  defaults,
}: {
  trigger: React.ReactNode;
  accounts: AccountOption[];
  defaults?: TransferDefaults;
}) {
  const [open, setOpen] = React.useState(false);
  const isEdit = Boolean(defaults?.id);
  const initial = React.useMemo<Values>(
    () => ({
      fromAccountId:
        defaults?.fromAccountId != null ? String(defaults.fromAccountId) : "",
      toAccountId:
        defaults?.toAccountId != null ? String(defaults.toAccountId) : "",
      amount: defaults?.amount ?? (undefined as unknown as number),
      occurredOn: defaults?.occurredOn ?? todayIso(),
      notes: defaults?.notes ?? "",
    }),
    [defaults],
  );
  const form = useForm<Values>({ defaultValues: initial });

  React.useEffect(() => {
    if (open) form.reset(initial);
  }, [open, initial, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    const res = await logTransfer({
      id: defaults?.id,
      fromAccountId: Number(values.fromAccountId),
      toAccountId: Number(values.toAccountId),
      amount: values.amount,
      occurredOn: values.occurredOn,
      notes: values.notes,
    });
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(isEdit ? "Transfer updated" : "Transfer logged");
    setOpen(false);
  });

  const labelFor = (id: string | null) => {
    if (!id) return "—";
    const a = accounts.find((a) => String(a.id) === id);
    return a?.name ?? "—";
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit transfer" : "Log transfer"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <FormField id="amount" label="Amount">
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
          <div className="grid grid-cols-2 gap-3">
            <FormField id="fromAccountId" label="From">
              <Select
                value={form.watch("fromAccountId")}
                onValueChange={(v) => form.setValue("fromAccountId", v ?? "")}
              >
                <SelectTrigger id="fromAccountId" className="w-full">
                  <SelectValue placeholder="—">
                    {(value: string | null) => labelFor(value)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField id="toAccountId" label="To">
              <Select
                value={form.watch("toAccountId")}
                onValueChange={(v) => form.setValue("toAccountId", v ?? "")}
              >
                <SelectTrigger id="toAccountId" className="w-full">
                  <SelectValue placeholder="—">
                    {(value: string | null) => labelFor(value)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>
          <FormField id="occurredOn" label="Date">
            <Input
              id="occurredOn"
              type="date"
              className="w-fit"
              {...form.register("occurredOn", { required: true })}
            />
          </FormField>
          <FormField id="notes" label="Notes">
            <Input id="notes" {...form.register("notes")} />
          </FormField>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline">Cancel</Button>} />
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {isEdit ? "Save" : "Log transfer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
