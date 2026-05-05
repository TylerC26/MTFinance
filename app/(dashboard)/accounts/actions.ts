"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { dollarsToCents } from "@/lib/money";

const updateAccountSchema = z.object({
  id: z.coerce.number().int(),
  name: z.string().trim().min(1, "Name is required").max(60),
  openingBalance: z.coerce.number().min(0, "Opening balance must be ≥ 0"),
  openingAsOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
});

export type UpdateAccountResult = { ok: true } | { ok: false; error: string };

export async function updateCashAccount(
  input: unknown,
): Promise<UpdateAccountResult> {
  const parsed = updateAccountSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { id, name, openingBalance, openingAsOf } = parsed.data;
  await db
    .update(schema.cashAccounts)
    .set({
      name,
      openingBalanceCents: dollarsToCents(openingBalance),
      openingAsOf,
    })
    .where(eq(schema.cashAccounts.id, id));
  revalidatePath("/accounts");
  revalidatePath("/");
  return { ok: true };
}

const transferSchema = z
  .object({
    id: z.coerce.number().int().optional(),
    fromAccountId: z.coerce.number().int(),
    toAccountId: z.coerce.number().int(),
    amount: z.coerce.number().positive("Amount must be > 0"),
    occurredOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
    notes: z.string().max(200).default(""),
  })
  .refine((v) => v.fromAccountId !== v.toAccountId, {
    message: "From and To must differ",
    path: ["toAccountId"],
  });

export type TransferResult = { ok: true } | { ok: false; error: string };

export async function logTransfer(input: unknown): Promise<TransferResult> {
  const parsed = transferSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { id, fromAccountId, toAccountId, amount, occurredOn, notes } =
    parsed.data;
  const amountCents = dollarsToCents(amount);
  if (id) {
    await db
      .update(schema.transfers)
      .set({ fromAccountId, toAccountId, amountCents, occurredOn, notes })
      .where(eq(schema.transfers.id, id));
  } else {
    await db
      .insert(schema.transfers)
      .values({ fromAccountId, toAccountId, amountCents, occurredOn, notes });
  }
  revalidatePath("/accounts");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteTransfer(id: number) {
  await db.delete(schema.transfers).where(eq(schema.transfers.id, id));
  revalidatePath("/accounts");
  revalidatePath("/");
}
