"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { upsertCategory } from "@/app/(dashboard)/categories/actions";
import { cn } from "@/lib/utils";
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
  hasBudget: "yes" | "no";
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
  const initialHasBudget: "yes" | "no" =
    (defaults?.monthlyBudget ?? 0) > 0 ? "yes" : "no";
  const form = useForm<Values>({
    defaultValues: {
      name: defaults?.name ?? "",
      color: defaults?.color ?? "#64748b",
      monthlyBudget: defaults?.monthlyBudget ?? 0,
      hasBudget: initialHasBudget,
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        name: defaults?.name ?? "",
        color: defaults?.color ?? "#64748b",
        monthlyBudget: defaults?.monthlyBudget ?? 0,
        hasBudget: (defaults?.monthlyBudget ?? 0) > 0 ? "yes" : "no",
      });
    }
  }, [open, defaults, form]);

  const hasBudget = form.watch("hasBudget");

  const onSubmit = form.handleSubmit(async (values) => {
    const res = await upsertCategory({
      name: values.name,
      color: values.color,
      monthlyBudget: values.hasBudget === "yes" ? values.monthlyBudget : 0,
      id: defaults?.id,
    });
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
          <FormField id="hasBudget" label="Tracking">
            <div
              role="radiogroup"
              className="inline-flex w-full rounded-md border border-input bg-background p-0.5"
            >
              {(
                [
                  { value: "yes", label: "Monthly budget" },
                  { value: "no", label: "Track expenses only" },
                ] as const
              ).map((o) => {
                const active = hasBudget === o.value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => form.setValue("hasBudget", o.value)}
                    className={cn(
                      "flex-1 rounded-sm px-2 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                      active
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          </FormField>
          {hasBudget === "yes" ? (
            <FormField
              id="monthlyBudget"
              label="Monthly budget"
              hint="In dollars"
              error={form.formState.errors.monthlyBudget?.message}
            >
              <AmountInput
                id="monthlyBudget"
                {...form.register("monthlyBudget", {
                  valueAsNumber: true,
                  min: { value: 0, message: "Must be ≥ 0" },
                })}
              />
            </FormField>
          ) : null}
          <FormField id="color" label="Color">
            <Input id="color" type="color" className="w-20" {...form.register("color")} />
          </FormField>
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
