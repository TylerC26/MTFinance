"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { updateCashAccount } from "@/app/(dashboard)/accounts/actions";
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

export type CashAccountDefaults = {
  id: number;
  name: string;
  owner: string;
  openingBalance: number;
  openingAsOf: string;
};

type Values = {
  name: string;
  openingBalance: number;
  openingAsOf: string;
};

const ownerLabel: Record<string, string> = {
  tyler: "Tyler",
  wife: "Michelle",
  joint: "Joint",
};

export function CashAccountFormDialog({
  trigger,
  defaults,
}: {
  trigger: React.ReactNode;
  defaults: CashAccountDefaults;
}) {
  const [open, setOpen] = React.useState(false);
  const form = useForm<Values>({
    defaultValues: {
      name: defaults.name,
      openingBalance: defaults.openingBalance,
      openingAsOf: defaults.openingAsOf,
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        name: defaults.name,
        openingBalance: defaults.openingBalance,
        openingAsOf: defaults.openingAsOf,
      });
    }
  }, [open, defaults, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    const res = await updateCashAccount({ id: defaults.id, ...values });
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Account updated");
    setOpen(false);
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {ownerLabel[defaults.owner] ?? defaults.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <FormField id="name" label="Display name">
            <Input
              id="name"
              autoFocus
              {...form.register("name", { required: "Required" })}
            />
          </FormField>
          <FormField id="openingBalance" label="Opening balance">
            <AmountInput
              id="openingBalance"
              {...form.register("openingBalance", {
                valueAsNumber: true,
                required: true,
              })}
            />
          </FormField>
          <FormField id="openingAsOf" label="As of">
            <Input
              id="openingAsOf"
              type="date"
              className="w-fit"
              {...form.register("openingAsOf", { required: true })}
            />
          </FormField>
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
