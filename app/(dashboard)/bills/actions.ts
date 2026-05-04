"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { dollarsToCents } from "@/lib/money";
import { todayIso } from "@/lib/dates";

const upsertSchema = z.object({
  id: z.coerce.number().int().optional(),
  name: z.string().trim().min(1, "Name is required").max(60),
  amount: z.coerce.number().positive(),
  dueDay: z.coerce.number().int().min(1).max(31),
  categoryId: z
    .union([z.coerce.number().int(), z.literal(""), z.null(), z.undefined()])
    .transform((v) => (v === "" || v == null ? null : (v as number))),
  autopay: z.coerce.boolean().default(false),
  active: z.coerce.boolean().default(true),
  notes: z.string().max(200).default(""),
});

export type UpsertBillResult = { ok: true } | { ok: false; error: string };

export async function upsertBill(input: unknown): Promise<UpsertBillResult> {
  const parsed = upsertSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { id, name, amount, dueDay, categoryId, autopay, active, notes } = parsed.data;
  const amountCents = dollarsToCents(amount);
  if (id) {
    await db
      .update(schema.bills)
      .set({ name, amountCents, dueDay, categoryId, autopay, active, notes })
      .where(eq(schema.bills.id, id));
  } else {
    await db
      .insert(schema.bills)
      .values({ name, amountCents, dueDay, categoryId, autopay, active, notes });
  }
  revalidatePath("/bills");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteBill(id: number) {
  await db.delete(schema.bills).where(eq(schema.bills.id, id));
  revalidatePath("/bills");
  revalidatePath("/");
}

export async function setBillPaid(
  billId: number,
  yearMonth: string,
  paid: boolean,
  amountCents: number,
) {
  if (paid) {
    await db
      .insert(schema.billPayments)
      .values({
        billId,
        yearMonth,
        paidOn: todayIso(),
        amountCents,
      })
      .onConflictDoUpdate({
        target: [schema.billPayments.billId, schema.billPayments.yearMonth],
        set: { paidOn: todayIso(), amountCents },
      });
  } else {
    await db
      .delete(schema.billPayments)
      .where(
        and(
          eq(schema.billPayments.billId, billId),
          eq(schema.billPayments.yearMonth, yearMonth),
        ),
      );
  }
  revalidatePath("/bills");
  revalidatePath("/");
}
