import {
  activeIncomeForMonth,
  billsWithPaymentStatus,
  investmentTotalSeries,
  latestBalancePerAccount,
  listCategories,
  spendByCategoryForMonth,
  totalSpendForMonth,
} from "@/lib/queries";
import { formatCents } from "@/lib/money";
import {
  currentYearMonth,
  formatYearMonthLabel,
  isValidYearMonth,
} from "@/lib/dates";
import { PlusIcon } from "lucide-react";
import { BudgetBars } from "@/components/charts/budget-bars";
import { InvestmentTrendChart } from "@/components/charts/investment-trend";
import { ExpenseDonut } from "@/components/charts/expense-donut";
import { BillReminders } from "@/components/bill-reminders";
import { Button } from "@/components/ui/button";
import { ExpenseFormDialog } from "@/components/forms/expense-form";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const sp = await searchParams;
  const monthRaw = sp.month;
  const month = monthRaw && isValidYearMonth(monthRaw) ? monthRaw : currentYearMonth();
  const [income, bills, spend, byCategory, categories, latestBalances, series] =
    await Promise.all([
      activeIncomeForMonth(month),
      billsWithPaymentStatus(month),
      totalSpendForMonth(month),
      spendByCategoryForMonth(month),
      listCategories(),
      latestBalancePerAccount(),
      investmentTotalSeries(),
    ]);

  const incomeTotal = income.reduce((s, i) => s + i.amountCents, 0);
  const billsTotal = bills.reduce((s, b) => s + b.bill.amountCents, 0);
  const billsPaid = bills
    .filter((b) => b.payment)
    .reduce((s, b) => s + b.bill.amountCents, 0);
  const billsUnpaidCount = bills.filter((b) => !b.payment).length;
  const investmentTotal = (
    latestBalances as Array<{ balance_cents: number | null }>
  ).reduce((s, r) => s + (r.balance_cents ?? 0), 0);
  const net = incomeTotal - spend - billsTotal;

  const spendByCat = new Map<
    number | null,
    {
      totalCents: number;
      categoryName?: string;
      categoryColor?: string;
    }
  >();
  for (const row of byCategory) {
    spendByCat.set(row.categoryId, {
      totalCents: row.totalCents,
      categoryName: row.categoryName ?? undefined,
      categoryColor: row.categoryColor ?? undefined,
    });
  }
  const budgetRows = categories
    .filter((c) => !c.archived)
    .map((c) => ({
      label: c.name,
      color: c.color,
      spentCents: spendByCat.get(c.id)?.totalCents ?? 0,
      budgetCents: c.monthlyBudgetCents,
    }))
    .sort((a, b) => b.spentCents - a.spentCents);
  const uncatSpend = spendByCat.get(null)?.totalCents ?? 0;
  if (uncatSpend > 0) {
    budgetRows.push({
      label: "Uncategorized",
      color: "#94a3b8",
      spentCents: uncatSpend,
      budgetCents: 0,
    });
  }

  const activeCategories = categories.filter((c) => !c.archived);
  const totalBudget = activeCategories.reduce(
    (s, c) => s + c.monthlyBudgetCents,
    0,
  );
  const expenseCategories = activeCategories.map((c) => ({
    id: c.id,
    name: c.name,
  }));

  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const donutSlices = byCategory
    .map((row) => {
      const cat = row.categoryId ? categoryById.get(row.categoryId) : null;
      return {
        name: cat?.name ?? row.categoryName ?? "Uncategorized",
        color: cat?.color ?? row.categoryColor ?? "#94a3b8",
        value: row.totalCents,
      };
    })
    .filter((s) => s.value > 0)
    .sort((a, b) => b.value - a.value);

  return (
    <div className="flex flex-col gap-6 sm:gap-10 max-w-[1200px]">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-6 pb-4 border-b border-border">
        <div className="flex items-end gap-4">
          <div className="flex flex-col gap-1">
            <p className="eyebrow">Month under review</p>
            <h2 className="font-display text-3xl sm:text-4xl tracking-tight leading-none">
              {formatYearMonthLabel(month)}
            </h2>
          </div>
          <ExpenseFormDialog
            categories={expenseCategories}
            trigger={
              <Button size="sm">
                <PlusIcon /> Log expense
              </Button>
            }
          />
        </div>
        <p className="text-xs text-muted-foreground max-w-xs sm:text-right leading-relaxed">
          A folio of household accounts — earnings, fixed obligations, daily
          outlays, and the slow climb of capital.
        </p>
      </header>

      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-px bg-border rounded-xl overflow-hidden border border-border">
        <FigureBlock
          eyebrow="Earnings"
          value={incomeTotal}
          caption={`${income.length} active source${income.length === 1 ? "" : "s"}`}
          className="order-4 lg:order-none"
        />
        <FigureBlock
          eyebrow="Outlays"
          value={spend}
          caption={`${billsUnpaidCount === 0 ? "all bills paid" : `${billsUnpaidCount} bill${billsUnpaidCount === 1 ? "" : "s"} due`}`}
          className="order-1 lg:order-none"
        />
        <FigureBlock
          eyebrow="Bills"
          value={billsPaid}
          caption={`of ${formatCents(billsTotal, { whole: true })} owed`}
          className="order-3 lg:order-none"
        />
        <FigureBlock
          eyebrow="Capital"
          value={investmentTotal}
          caption="latest snapshot"
          className="hidden lg:flex"
        />
        <FigureBlock
          eyebrow="Net"
          value={net}
          caption="earnings less outlays"
          tone={net >= 0 ? "positive" : "negative"}
          accent
          className="order-2 lg:order-none"
        />
      </section>

      <section className="grid grid-cols-1 gap-4 sm:gap-6 items-stretch">
        <Panel
          eyebrow="Folio II"
          title="Outlays"
          aside={
            totalBudget > 0
              ? `${formatCents(spend, { whole: true })} of ${formatCents(totalBudget, { whole: true })} pledged`
              : spend > 0
                ? formatCents(spend, { whole: true })
                : undefined
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-[minmax(220px,1fr)_2fr] gap-6 md:gap-8 h-full">
            <div className="flex flex-col gap-2 min-w-0">
              <p className="eyebrow">Where it went</p>
              <div className="flex-1 min-h-[260px] md:min-h-[220px]">
                <ExpenseDonut slices={donutSlices} totalCents={spend} />
              </div>
            </div>
            <div className="flex flex-col gap-2 min-w-0 md:border-l md:border-dashed md:border-border md:pl-8 pt-4 md:pt-0 border-t md:border-t-0 border-dashed border-border">
              <p className="eyebrow">Vs. allowance</p>
              <div className="flex-1">
                <BudgetBars rows={budgetRows} />
              </div>
            </div>
          </div>
        </Panel>
        <Panel
          eyebrow="Folio III"
          title="Coming up"
          aside={
            billsUnpaidCount > 0
              ? `${billsUnpaidCount} due`
              : `${bills.length} settled`
          }
        >
          <BillReminders rows={bills} yearMonth={month} />
        </Panel>
        <Panel
          eyebrow="Folio V"
          title="Capital, ascending"
          aside={`${(series as unknown[]).length} entries`}
        >
          <InvestmentTrendChart
            data={series as Array<{ as_of: string; total_cents: number }>}
          />
        </Panel>
      </section>
    </div>
  );
}

function FigureBlock({
  eyebrow,
  value,
  caption,
  tone,
  accent,
  className,
}: {
  eyebrow: string;
  value: number;
  caption?: string;
  tone?: "positive" | "negative";
  accent?: boolean;
  className?: string;
}) {
  const valueClass =
    tone === "positive"
      ? "text-positive"
      : tone === "negative"
        ? "text-destructive"
        : accent
          ? "text-accent"
          : "text-foreground";

  return (
    <div
      className={`bg-card px-4 sm:px-5 py-4 sm:py-6 flex flex-col gap-2 sm:gap-3 relative ${className ?? ""}`}
    >
      {accent ? (
        <span
          aria-hidden
          className="absolute top-0 left-0 h-px w-12 bg-accent"
        />
      ) : null}
      <p className="eyebrow">{eyebrow}</p>
      <p
        className={`font-mono text-xl sm:text-[26px] tracking-tight leading-none ${valueClass}`}
        data-numeric
      >
        {formatCents(value, { whole: true })}
      </p>
      {caption ? (
        <p className="text-[11px] text-muted-foreground tracking-wide leading-snug">
          {caption}
        </p>
      ) : null}
    </div>
  );
}

function Panel({
  eyebrow,
  title,
  aside,
  children,
  className,
}: {
  eyebrow: string;
  title: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-border bg-card p-4 sm:p-6 flex flex-col gap-4 sm:gap-5 ${className ?? ""}`}
    >
      <header className="flex items-baseline justify-between gap-3 pb-3 border-b border-dashed border-border">
        <div className="flex items-baseline gap-2 sm:gap-3 min-w-0">
          <span className="eyebrow shrink-0">{eyebrow}</span>
          <h3 className="font-display text-base sm:text-lg tracking-tight truncate">
            {title}
          </h3>
        </div>
        {aside ? (
          typeof aside === "string" ? (
            <span className="font-mono text-[10px] sm:text-[11px] text-muted-foreground shrink-0 text-right">
              {aside}
            </span>
          ) : (
            <div className="shrink-0">{aside}</div>
          )
        ) : null}
      </header>
      <div className="flex-1">{children}</div>
    </section>
  );
}
