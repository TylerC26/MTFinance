import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { monthBounds, type YearMonth } from "@/lib/dates";

export async function listCategories() {
  return db
    .select()
    .from(schema.categories)
    .orderBy(asc(schema.categories.archived), asc(schema.categories.name));
}

export async function listIncomeSources() {
  return db
    .select()
    .from(schema.incomeSources)
    .orderBy(desc(schema.incomeSources.amountCents));
}

export async function activeIncomeForMonth(ym: YearMonth) {
  const { start, end } = monthBounds(ym);
  return db
    .select()
    .from(schema.incomeSources)
    .where(
      and(
        lte(schema.incomeSources.startMonth, end),
        sql`(${schema.incomeSources.endMonth} is null or ${schema.incomeSources.endMonth} >= ${start})`,
      ),
    )
    .orderBy(desc(schema.incomeSources.amountCents));
}

export async function listBills() {
  return db
    .select()
    .from(schema.bills)
    .orderBy(asc(schema.bills.dueDay), asc(schema.bills.name));
}

export async function billsWithPaymentStatus(ym: YearMonth) {
  const rows = await db
    .select({
      bill: schema.bills,
      payment: schema.billPayments,
    })
    .from(schema.bills)
    .leftJoin(
      schema.billPayments,
      and(
        eq(schema.billPayments.billId, schema.bills.id),
        eq(schema.billPayments.yearMonth, ym),
      ),
    )
    .where(eq(schema.bills.active, true))
    .orderBy(asc(schema.bills.dueDay));
  return rows;
}

export async function listExpensesForMonth(ym: YearMonth) {
  const { start, end } = monthBounds(ym);
  return db
    .select({
      expense: schema.expenses,
      category: schema.categories,
    })
    .from(schema.expenses)
    .leftJoin(
      schema.categories,
      eq(schema.expenses.categoryId, schema.categories.id),
    )
    .where(
      and(
        gte(schema.expenses.occurredOn, start),
        lte(schema.expenses.occurredOn, end),
      ),
    )
    .orderBy(desc(schema.expenses.occurredOn), desc(schema.expenses.id));
}

export async function spendByCategoryForMonth(ym: YearMonth) {
  const { start, end } = monthBounds(ym);
  const rows = await db
    .select({
      categoryId: schema.expenses.categoryId,
      categoryName: schema.categories.name,
      categoryColor: schema.categories.color,
      monthlyBudgetCents: schema.categories.monthlyBudgetCents,
      totalCents: sql<number>`coalesce(sum(${schema.expenses.amountCents}), 0)::int`,
    })
    .from(schema.expenses)
    .leftJoin(
      schema.categories,
      eq(schema.expenses.categoryId, schema.categories.id),
    )
    .where(
      and(
        gte(schema.expenses.occurredOn, start),
        lte(schema.expenses.occurredOn, end),
      ),
    )
    .groupBy(
      schema.expenses.categoryId,
      schema.categories.name,
      schema.categories.color,
      schema.categories.monthlyBudgetCents,
    );
  return rows;
}

export async function totalSpendForMonth(ym: YearMonth): Promise<number> {
  const { start, end } = monthBounds(ym);
  const [row] = await db
    .select({
      total: sql<number>`coalesce(sum(${schema.expenses.amountCents}), 0)::int`,
    })
    .from(schema.expenses)
    .where(
      and(
        gte(schema.expenses.occurredOn, start),
        lte(schema.expenses.occurredOn, end),
      ),
    );
  return row?.total ?? 0;
}

export async function listCashAccounts() {
  return db
    .select()
    .from(schema.cashAccounts)
    .where(eq(schema.cashAccounts.archived, false))
    .orderBy(asc(schema.cashAccounts.id));
}

export async function listInvestmentAccounts() {
  return db
    .select()
    .from(schema.investmentAccounts)
    .orderBy(asc(schema.investmentAccounts.archived), asc(schema.investmentAccounts.name));
}

export async function listInvestmentBalances() {
  return db
    .select({
      balance: schema.investmentBalances,
      account: schema.investmentAccounts,
    })
    .from(schema.investmentBalances)
    .innerJoin(
      schema.investmentAccounts,
      eq(schema.investmentBalances.accountId, schema.investmentAccounts.id),
    )
    .orderBy(desc(schema.investmentBalances.asOf));
}

export async function latestBalancePerAccount() {
  const rows = await db.execute<{
    account_id: number;
    name: string;
    kind: string;
    owner: string;
    archived: boolean;
    as_of: string;
    balance_cents: number;
  }>(sql`
    select distinct on (a.id)
      a.id as account_id,
      a.name,
      a.kind,
      a.owner,
      a.archived,
      b.as_of,
      b.balance_cents
    from ${schema.investmentAccounts} a
    left join ${schema.investmentBalances} b on b.account_id = a.id
    where a.archived = false
    order by a.id, b.as_of desc nulls last
  `);
  return rows.rows ?? rows;
}

export async function investmentTotalSeries() {
  const rows = await db.execute<{ as_of: string; total_cents: number }>(sql`
    with snapshots as (
      select b.account_id, b.as_of, b.balance_cents,
        row_number() over (partition by b.account_id order by b.as_of desc) as rn
      from ${schema.investmentBalances} b
    ),
    days as (
      select distinct as_of from ${schema.investmentBalances}
    ),
    latest_per_account_per_day as (
      select d.as_of, b.account_id,
        (
          select balance_cents
          from ${schema.investmentBalances} b2
          where b2.account_id = b.account_id and b2.as_of <= d.as_of
          order by b2.as_of desc
          limit 1
        ) as balance_cents
      from days d
      cross join (select distinct account_id from ${schema.investmentBalances}) b
    )
    select as_of, sum(coalesce(balance_cents, 0))::int as total_cents
    from latest_per_account_per_day
    group by as_of
    order by as_of asc
  `);
  return rows.rows ?? rows;
}
