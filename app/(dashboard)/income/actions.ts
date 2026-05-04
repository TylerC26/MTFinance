"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { dollarsToCents } from "@/lib/money";

const upsertSchema = z.object({
  id: z.coerce.number().int().optional(),
  name: z.string().trim().min(1, "Name is required").max(60),
  amount: z.coerce.number().positive("Amount must be > 0"),
  payer: z.enum(["tyler", "wife", "joint"]).default("joint"),
  startMonth: z.string().regex(/^\d{4}-\d{2}$/, "Use YYYY-MM"),
  endMonth: z
    .union([z.string().regex(/^\d{4}-\d{2}$/), z.literal(""), z.null()])
    .optional()
    .transform((v) => (v && v !== "" ? v : null)),
  notes: z.string().max(200).default(""),
});

export type UpsertIncomeResult = { ok: true } | { ok: false; error: string };

export async function upsertIncome(input: unknown): Promise<UpsertIncomeResult> {
  const parsed = upsertSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { id, name, amount, payer, startMonth, endMonth, notes } = parsed.data;
  const amountCents = dollarsToCents(amount);
  const startDate = `${startMonth}-01`;
  const endDate = endMonth ? `${endMonth}-01` : null;
  if (id) {
    await db
      .update(schema.incomeSources)
      .set({
        name,
        amountCents,
        payer,
        startMonth: startDate,
        endMonth: endDate,
        notes,
      })
      .where(eq(schema.incomeSources.id, id));
  } else {
    await db.insert(schema.incomeSources).values({
      name,
      amountCents,
      payer,
      startMonth: startDate,
      endMonth: endDate,
      notes,
    });
  }
  revalidatePath("/income");
  revalidatePath("/");
  revalidatePath("/reports");
  return { ok: true };
}

export async function deleteIncome(id: number) {
  await db.delete(schema.incomeSources).where(eq(schema.incomeSources.id, id));
  revalidatePath("/income");
  revalidatePath("/");
  revalidatePath("/reports");
}
