import { sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { lastNMonths, type YearMonth } from "@/lib/dates";

export type MonthSeriesPoint = {
  ym: YearMonth;
  incomeCents: number;
  spendCents: number;
  billsCents: number;
};

export async function monthSeries(months = 12): Promise<MonthSeriesPoint[]> {
  const targets = lastNMonths(months);
  const incomeRows = await db.execute<{ ym: string; total_cents: number }>(sql`
    select to_char(d::date, 'YYYY-MM') as ym,
      coalesce(sum(i.amount_cents), 0)::bigint as total_cents
    from generate_series(
      to_date(${targets[0]} || '-01', 'YYYY-MM-DD'),
      to_date(${targets[targets.length - 1]} || '-01', 'YYYY-MM-DD'),
      '1 month'::interval
    ) as d
    left join ${schema.incomeSources} i
      on i.start_month <= (d + interval '1 month' - interval '1 day')::date
      and (i.end_month is null or i.end_month >= d::date)
    group by d
    order by d
  `);

  const spendRows = await db.execute<{ ym: string; total_cents: number }>(sql`
    select to_char(occurred_on, 'YYYY-MM') as ym,
      coalesce(sum(amount_cents), 0)::bigint as total_cents
    from ${schema.expenses}
    where occurred_on >= to_date(${targets[0]} || '-01', 'YYYY-MM-DD')
    group by 1
  `);

  const billsRows = await db.execute<{ ym: string; total_cents: number }>(sql`
    select year_month as ym,
      coalesce(sum(amount_cents), 0)::bigint as total_cents
    from ${schema.billPayments}
    where year_month >= ${targets[0]}
    group by 1
  `);

  const incomeMap = new Map(
    (incomeRows.rows ?? incomeRows).map((r: { ym: string; total_cents: number }) => [
      r.ym,
      Number(r.total_cents),
    ]),
  );
  const spendMap = new Map(
    (spendRows.rows ?? spendRows).map((r: { ym: string; total_cents: number }) => [
      r.ym,
      Number(r.total_cents),
    ]),
  );
  const billsMap = new Map(
    (billsRows.rows ?? billsRows).map((r: { ym: string; total_cents: number }) => [
      r.ym,
      Number(r.total_cents),
    ]),
  );

  return targets.map((ym) => ({
    ym,
    incomeCents: incomeMap.get(ym) ?? 0,
    spendCents: spendMap.get(ym) ?? 0,
    billsCents: billsMap.get(ym) ?? 0,
  }));
}
