"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { upsertCategory } from "@/app/(dashboard)/categories/actions";
import { Input } from "@/components/ui/input";
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

type Defaults = {
  id?: number;
  name?: string;
  color?: string;
  monthlyBudget?: number;
};

type Values = {
  name: string;
  color: string;
  monthlyBudget: number;
};

export function CategoryFormDialog({
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
      color: defaults?.color ?? "#64748b",
      monthlyBudget: defaults?.monthlyBudget ?? 0,
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        name: defaults?.name ?? "",
        color: defaults?.color ?? "#64748b",
        monthlyBudget: defaults?.monthlyBudget ?? 0,
      });
    }
  }, [open, defaults, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    const res = await upsertCategory({ ...values, id: defaults?.id });
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(isEdit ? "Category updated" : "Category added");
    setOpen(false);
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit category" : "New category"}</DialogTitle>
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
              placeholder="e.g. Groceries"
              {...form.register("name", { required: "Name is required" })}
            />
          </FormField>
          <div className="grid grid-cols-[120px_1fr] gap-3">
            <FormField id="color" label="Color">
              <Input id="color" type="color" {...form.register("color")} />
            </FormField>
            <FormField
              id="monthlyBudget"
              label="Monthly budget"
              hint="In dollars"
              error={form.formState.errors.monthlyBudget?.message}
            >
              <Input
                id="monthlyBudget"
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                {...form.register("monthlyBudget", {
                  valueAsNumber: true,
                  min: { value: 0, message: "Must be ≥ 0" },
                })}
              />
            </FormField>
          </div>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline">Cancel</Button>} />
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {isEdit ? "Save" : "Add category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
