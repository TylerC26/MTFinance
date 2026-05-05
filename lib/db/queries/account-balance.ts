import { and, eq, gte, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";

export type AccountBalance = {
  id: number;
  name: string;
  owner: string;
  openingBalanceCents: number;
  openingAsOf: string;
  balanceCents: number;
  transfersInCents: number;
  transfersOutCents: number;
  expensesCents: number;
  billPaymentsCents: number;
  estimatedIncomeCents: number;
};

function monthsBetween(fromIso: string, toDate: Date): number {
  const from = new Date(fromIso + "T00:00:00Z");
  const fromYears = from.getUTCFullYear();
  const fromMonths = from.getUTCMonth();
  const toYears = toDate.getUTCFullYear();
  const toMonths = toDate.getUTCMonth();
  const diff = (toYears - fromYears) * 12 + (toMonths - fromMonths);
  return Math.max(0, diff);
}

export async function getAccountBalances(): Promise<AccountBalance[]> {
  const accounts = await db
    .select()
    .from(schema.cashAccounts)
    .orderBy(schema.cashAccounts.id);

  const today = new Date();
  const result: AccountBalance[] = [];

  for (const a of accounts) {
    const [transfersIn] = await db
      .select({
        sum: sql<number>`coalesce(sum(${schema.transfers.amountCents}), 0)`,
      })
      .from(schema.transfers)
      .where(
        and(
          eq(schema.transfers.toAccountId, a.id),
          gte(schema.transfers.occurredOn, a.openingAsOf),
        ),
      );

    const [transfersOut] = await db
      .select({
        sum: sql<number>`coalesce(sum(${schema.transfers.amountCents}), 0)`,
      })
      .from(schema.transfers)
      .where(
        and(
          eq(schema.transfers.fromAccountId, a.id),
          gte(schema.transfers.occurredOn, a.openingAsOf),
        ),
      );

    const [expenseSum] = await db
      .select({
        sum: sql<number>`coalesce(sum(${schema.expenses.amountCents}), 0)`,
      })
      .from(schema.expenses)
      .where(
        and(
          eq(schema.expenses.accountId, a.id),
          gte(schema.expenses.occurredOn, a.openingAsOf),
        ),
      );

    const [billSum] = await db
      .select({
        sum: sql<number>`coalesce(sum(${schema.billPayments.amountCents}), 0)`,
      })
      .from(schema.billPayments)
      .where(
        and(
          eq(schema.billPayments.accountId, a.id),
          gte(schema.billPayments.paidOn, a.openingAsOf),
        ),
      );

    const incomes = await db
      .select({
        amountCents: schema.incomeSources.amountCents,
        startMonth: schema.incomeSources.startMonth,
        endMonth: schema.incomeSources.endMonth,
      })
      .from(schema.incomeSources)
      .where(eq(schema.incomeSources.accountId, a.id));

    let estimatedIncome = 0;
    for (const inc of incomes) {
      const fromIso =
        inc.startMonth > a.openingAsOf ? inc.startMonth : a.openingAsOf;
      const toDate = inc.endMonth ? new Date(inc.endMonth + "T00:00:00Z") : today;
      const months = monthsBetween(fromIso, toDate);
      estimatedIncome += inc.amountCents * months;
    }

    const transfersInCents = Number(transfersIn?.sum ?? 0);
    const transfersOutCents = Number(transfersOut?.sum ?? 0);
    const expensesCents = Number(expenseSum?.sum ?? 0);
    const billPaymentsCents = Number(billSum?.sum ?? 0);

    result.push({
      id: a.id,
      name: a.name,
      owner: a.owner,
      openingBalanceCents: a.openingBalanceCents,
      openingAsOf: a.openingAsOf,
      transfersInCents,
      transfersOutCents,
      expensesCents,
      billPaymentsCents,
      estimatedIncomeCents: estimatedIncome,
      balanceCents:
        a.openingBalanceCents +
        transfersInCents -
        transfersOutCents -
        expensesCents -
        billPaymentsCents +
        estimatedIncome,
    });
  }
  return result;
}

export async function listTransfers(): Promise<
  Array<{
    id: number;
    fromAccountId: number;
    toAccountId: number;
    fromName: string;
    toName: string;
    amountCents: number;
    occurredOn: string;
    notes: string;
  }>
> {
  const rows = await db
    .select({
      id: schema.transfers.id,
      fromAccountId: schema.transfers.fromAccountId,
      toAccountId: schema.transfers.toAccountId,
      amountCents: schema.transfers.amountCents,
      occurredOn: schema.transfers.occurredOn,
      notes: schema.transfers.notes,
    })
    .from(schema.transfers)
    .orderBy(sql`${schema.transfers.occurredOn} desc, ${schema.transfers.id} desc`);

  const accounts = await db
    .select({
      id: schema.cashAccounts.id,
      name: schema.cashAccounts.name,
    })
    .from(schema.cashAccounts);
  const nameById = new Map(accounts.map((a) => [a.id, a.name]));
  return rows.map((r) => ({
    ...r,
    fromName: nameById.get(r.fromAccountId) ?? "?",
    toName: nameById.get(r.toAccountId) ?? "?",
  }));
}
