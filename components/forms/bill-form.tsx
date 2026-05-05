"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { upsertBill } from "@/app/(dashboard)/bills/actions";
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

type Category = { id: number; name: string };

type Defaults = {
  id?: number;
  name?: string;
  amount?: number;
  dueDay?: number;
  categoryId?: number | null;
  autopay?: boolean;
  active?: boolean;
  notes?: string;
};

type Values = {
  name: string;
  amount: number;
  dueDay: number;
  categoryId: string;
  autopay: boolean;
  active: boolean;
  notes: string;
};

export function BillFormDialog({
  trigger,
  categories,
  defaults,
}: {
  trigger: React.ReactNode;
  categories: Category[];
  defaults?: Defaults;
}) {
  const [open, setOpen] = React.useState(false);
  const isEdit = Boolean(defaults?.id);
  const form = useForm<Values>({
    defaultValues: {
      name: defaults?.name ?? "",
      amount: defaults?.amount ?? 0,
      dueDay: defaults?.dueDay ?? 1,
      categoryId: defaults?.categoryId != null ? String(defaults.categoryId) : "",
      autopay: defaults?.autopay ?? false,
      active: defaults?.active ?? true,
      notes: defaults?.notes ?? "",
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        name: defaults?.name ?? "",
        amount: defaults?.amount ?? 0,
        dueDay: defaults?.dueDay ?? 1,
        categoryId: defaults?.categoryId != null ? String(defaults.categoryId) : "",
        autopay: defaults?.autopay ?? false,
        active: defaults?.active ?? true,
        notes: defaults?.notes ?? "",
      });
    }
  }, [open, defaults, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    const res = await upsertBill({
      ...values,
      id: defaults?.id,
      categoryId: values.categoryId === "" ? null : Number(values.categoryId),
    });
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(isEdit ? "Bill updated" : "Bill added");
    setOpen(false);
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit bill" : "New bill"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <FormField id="name" label="Name" error={form.formState.errors.name?.message}>
            <Input
              id="name"
              autoFocus
              placeholder="e.g. Rent"
              {...form.register("name", { required: "Required" })}
            />
          </FormField>
          <FormField id="amount" label="Amount">
            <AmountInput
              id="amount"
              {...form.register("amount", { valueAsNumber: true, required: true })}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField id="dueDay" label="Due day" hint="1-31">
              <Input
                id="dueDay"
                type="number"
                min="1"
                max="31"
                {...form.register("dueDay", { valueAsNumber: true, required: true })}
              />
            </FormField>
            <FormField id="categoryId" label="Category">
              <Select
                value={form.watch("categoryId")}
                onValueChange={(v) => form.setValue("categoryId", v ?? "")}
              >
                <SelectTrigger id="categoryId" className="w-full">
                  <SelectValue placeholder="—">
                    {(value: string | null) => {
                      if (!value) return "—";
                      const c = categories.find((c) => String(c.id) === value);
                      return c?.name ?? "—";
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">—</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...form.register("autopay")} />
              Autopay
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...form.register("active")} />
              Active
            </label>
          </div>
          <FormField id="notes" label="Notes">
            <Input id="notes" {...form.register("notes")} />
          </FormField>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline">Cancel</Button>} />
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {isEdit ? "Save" : "Add bill"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
