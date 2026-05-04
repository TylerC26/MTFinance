"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { upsertAccount } from "@/app/(dashboard)/investments/actions";
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

type Defaults = {
  id?: number;
  name?: string;
  kind?: string;
  owner?: string;
};

type Values = {
  name: string;
  kind: string;
  owner: string;
};

const KINDS = [
  ["401k", "401(k)"],
  ["ira", "Traditional IRA"],
  ["roth-ira", "Roth IRA"],
  ["brokerage", "Brokerage"],
  ["hsa", "HSA"],
  ["crypto", "Crypto"],
  ["cash", "Cash / Savings"],
  ["other", "Other"],
] as const;

export function AccountFormDialog({
  trigger,
  defaults,
}: {
  trigger: React.ReactNode;
  defaults?: Defaults;
}) {
  const [open, setOpen] = React.useState(false);
  const isEdit = Boolean(defaults?.id);
  const form = useForm<Values>({
    defaultValues: {
      name: defaults?.name ?? "",
      kind: defaults?.kind ?? "brokerage",
      owner: defaults?.owner ?? "joint",
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        name: defaults?.name ?? "",
        kind: defaults?.kind ?? "brokerage",
        owner: defaults?.owner ?? "joint",
      });
    }
  }, [open, defaults, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    const res = await upsertAccount({ ...values, id: defaults?.id });
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(isEdit ? "Account updated" : "Account added");
    setOpen(false);
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit account" : "New investment account"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <FormField id="name" label="Name">
            <Input
              id="name"
              autoFocus
              placeholder="e.g. Fidelity 401(k)"
              {...form.register("name", { required: true })}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField id="kind" label="Type">
              <Select
                value={form.watch("kind")}
                onValueChange={(v) => form.setValue("kind", v ?? "")}
              >
                <SelectTrigger id="kind">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KINDS.map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField id="owner" label="Owner">
              <Select
                value={form.watch("owner")}
                onValueChange={(v) => form.setValue("owner", v ?? "")}
              >
                <SelectTrigger id="owner">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tyler">Tyler</SelectItem>
                  <SelectItem value="wife">Michelle</SelectItem>
                  <SelectItem value="joint">Joint</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline">Cancel</Button>} />
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {isEdit ? "Save" : "Add account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
