"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { dollarsToCents } from "@/lib/money";

const accountSchema = z.object({
  id: z.coerce.number().int().optional(),
  name: z.string().trim().min(1).max(60),
  kind: z.enum(["401k", "ira", "roth-ira", "brokerage", "hsa", "crypto", "cash", "other"]),
  owner: z.enum(["tyler", "wife", "joint"]),
});

export async function upsertAccount(input: unknown) {
  const parsed = accountSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { id, ...rest } = parsed.data;
  if (id) {
    await db.update(schema.investmentAccounts).set(rest).where(eq(schema.investmentAccounts.id, id));
  } else {
    await db.insert(schema.investmentAccounts).values(rest);
  }
  revalidatePath("/investments");
  revalidatePath("/");
  revalidatePath("/reports");
  return { ok: true as const };
}

export async function archiveAccount(id: number, archived: boolean) {
  await db
    .update(schema.investmentAccounts)
    .set({ archived })
    .where(eq(schema.investmentAccounts.id, id));
  revalidatePath("/investments");
  revalidatePath("/");
  revalidatePath("/reports");
}

const balanceSchema = z.object({
  accountId: z.coerce.number().int().positive(),
  asOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  balance: z.coerce.number().min(0),
});

export async function logBalance(input: unknown) {
  const parsed = balanceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { accountId, asOf, balance } = parsed.data;
  const balanceCents = dollarsToCents(balance);
  await db
    .insert(schema.investmentBalances)
    .values({ accountId, asOf, balanceCents })
    .onConflictDoUpdate({
      target: [schema.investmentBalances.accountId, schema.investmentBalances.asOf],
      set: { balanceCents },
    });
  revalidatePath("/investments");
  revalidatePath("/");
  revalidatePath("/reports");
  return { ok: true as const };
}

export async function deleteBalance(id: number) {
  await db.delete(schema.investmentBalances).where(eq(schema.investmentBalances.id, id));
  revalidatePath("/investments");
  revalidatePath("/");
  revalidatePath("/reports");
}
