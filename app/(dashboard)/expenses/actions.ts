"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { dollarsToCents } from "@/lib/money";

const upsertSchema = z.object({
  id: z.coerce.number().int().optional(),
  occurredOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  amount: z.coerce.number().positive("Amount must be > 0"),
  categoryId: z
    .union([z.coerce.number().int(), z.literal(""), z.null(), z.undefined()])
    .transform((v) => (v === "" || v == null ? null : (v as number))),
  payer: z
    .union([z.string(), z.null(), z.undefined()])
    .transform((v) => (v && v !== "" ? v : null)),
  description: z.string().max(120).default(""),
});

export type UpsertExpenseResult = { ok: true } | { ok: false; error: string };

export async function upsertExpense(input: unknown): Promise<UpsertExpenseResult> {
  const parsed = upsertSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { id, occurredOn, amount, categoryId, payer, description } = parsed.data;
  const amountCents = dollarsToCents(amount);
  if (id) {
    await db
      .update(schema.expenses)
      .set({ occurredOn, amountCents, categoryId, payer, description })
      .where(eq(schema.expenses.id, id));
  } else {
    await db
      .insert(schema.expenses)
      .values({ occurredOn, amountCents, categoryId, payer, description });
  }
  revalidatePath("/expenses");
  revalidatePath("/");
  revalidatePath("/reports");
  return { ok: true };
}

export async function deleteExpense(id: number) {
  await db.delete(schema.expenses).where(eq(schema.expenses.id, id));
  revalidatePath("/expenses");
  revalidatePath("/");
  revalidatePath("/reports");
}

const bulkInsertSchema = z.array(upsertSchema.omit({ id: true })).min(1);

export type BulkInsertResult =
  | { ok: true; count: number }
  | { ok: false; error: string };

export async function bulkInsertExpenses(
  input: unknown[],
): Promise<BulkInsertResult> {
  const parsed = bulkInsertSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const rows = parsed.data.map(({ occurredOn, amount, categoryId, payer, description }) => ({
    occurredOn,
    amountCents: dollarsToCents(amount),
    categoryId,
    payer,
    description,
  }));
  await db.insert(schema.expenses).values(rows);
  revalidatePath("/expenses");
  revalidatePath("/");
  revalidatePath("/reports");
  return { ok: true, count: rows.length };
}
