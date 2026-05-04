"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { logBalance } from "@/app/(dashboard)/investments/actions";
import { Input } from "@/components/ui/input";
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

type Account = { id: number; name: string };

type Values = {
  accountId: string;
  asOf: string;
  balance: number;
};

export function BalanceFormDialog({
  trigger,
  accounts,
  defaultAccountId,
}: {
  trigger: React.ReactNode;
  accounts: Account[];
  defaultAccountId?: number;
}) {
  const [open, setOpen] = React.useState(false);
  const form = useForm<Values>({
    defaultValues: {
      accountId: defaultAccountId
        ? String(defaultAccountId)
        : accounts[0]
          ? String(accounts[0].id)
          : "",
      asOf: todayIso(),
      balance: 0,
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        accountId: defaultAccountId
          ? String(defaultAccountId)
          : accounts[0]
            ? String(accounts[0].id)
            : "",
        asOf: todayIso(),
        balance: 0,
      });
    }
  }, [open, accounts, defaultAccountId, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    const res = await logBalance({
      accountId: Number(values.accountId),
      asOf: values.asOf,
      balance: values.balance,
    });
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Balance logged");
    setOpen(false);
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log balance</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <FormField id="accountId" label="Account">
            <Select
              value={form.watch("accountId")}
              onValueChange={(v) => form.setValue("accountId", v ?? "")}
            >
              <SelectTrigger id="accountId">
                <SelectValue placeholder="Select account" />
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
          <div className="grid grid-cols-2 gap-3">
            <FormField id="asOf" label="As of">
              <Input id="asOf" type="date" {...form.register("asOf", { required: true })} />
            </FormField>
            <FormField id="balance" label="Balance">
              <Input
                id="balance"
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                autoFocus
                {...form.register("balance", { valueAsNumber: true, required: true })}
              />
            </FormField>
          </div>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline">Cancel</Button>} />
            <Button type="submit" disabled={form.formState.isSubmitting}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
