"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { dollarsToCents } from "@/lib/money";

const upsertSchema = z.object({
  id: z.coerce.number().int().optional(),
  name: z.string().trim().min(1, "Name is required").max(60),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Color must be a #RRGGBB hex"),
  monthlyBudget: z.coerce.number().min(0, "Budget must be ≥ 0"),
});

export type UpsertCategoryResult =
  | { ok: true }
  | { ok: false; error: string };

export async function upsertCategory(
  input: unknown,
): Promise<UpsertCategoryResult> {
  const parsed = upsertSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { id, name, color, monthlyBudget } = parsed.data;
  const monthlyBudgetCents = dollarsToCents(monthlyBudget);
  if (id) {
    await db
      .update(schema.categories)
      .set({ name, color, monthlyBudgetCents })
      .where(eq(schema.categories.id, id));
  } else {
    await db.insert(schema.categories).values({
      name,
      color,
      monthlyBudgetCents,
    });
  }
  revalidatePath("/categories");
  revalidatePath("/");
  return { ok: true };
}

export async function toggleArchived(id: number, archived: boolean) {
  await db
    .update(schema.categories)
    .set({ archived })
    .where(eq(schema.categories.id, id));
  revalidatePath("/categories");
  revalidatePath("/");
}

export async function deleteCategory(id: number) {
  await db.delete(schema.categories).where(eq(schema.categories.id, id));
  revalidatePath("/categories");
  revalidatePath("/");
}
