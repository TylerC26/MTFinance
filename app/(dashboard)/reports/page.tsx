import { investmentTotalSeries } from "@/lib/queries";
import { monthSeries } from "@/lib/reports";
import { formatCents } from "@/lib/money";
import { formatYearMonthShortLabel } from "@/lib/dates";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CashflowChart } from "@/components/charts/cashflow-chart";
import { InvestmentTrendChart } from "@/components/charts/investment-trend";
import { PageHeader } from "@/components/page-header";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const [series, invSeries] = await Promise.all([
    monthSeries(12),
    investmentTotalSeries(),
  ]);

  return (
    <div className="flex flex-col gap-8 max-w-[1200px]">
      <PageHeader
        eyebrow="Folio VII · Almanac"
        title="Reports"
        subtitle="Trailing twelve months of household activity."
        meta={<span>{series.length} months · {invSeries.length} balance entries</span>}
      />

      <section className="rounded-xl border border-border bg-card p-4 sm:p-6 flex flex-col gap-4 sm:gap-5">
        <header className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 sm:gap-4 pb-3 border-b border-dashed border-border">
          <div className="flex items-baseline gap-3">
            <span className="eyebrow">Cashflow</span>
            <h3 className="font-display text-base sm:text-lg tracking-tight">
              Earnings, outlays, and bills paid each month
            </h3>
          </div>
        </header>
        <CashflowChart data={series} />
      </section>

      <section className="rounded-xl border border-border bg-card p-4 sm:p-6 flex flex-col gap-4 sm:gap-5">
        <header className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 sm:gap-4 pb-3 border-b border-dashed border-border">
          <div className="flex items-baseline gap-3">
            <span className="eyebrow">Capital</span>
            <h3 className="font-display text-base sm:text-lg tracking-tight">
              Combined investment total, by date
            </h3>
          </div>
        </header>
        <InvestmentTrendChart
          data={invSeries as Array<{ as_of: string; total_cents: number }>}
        />
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline gap-3">
          <p className="eyebrow">Detail</p>
          <span className="h-px flex-1 bg-border" />
        </div>
        <div className="rounded-lg border border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border bg-muted/40">
                <TableHead className="eyebrow !text-muted-foreground">
                  Month
                </TableHead>
                <TableHead className="text-right eyebrow !text-muted-foreground">
                  Earnings
                </TableHead>
                <TableHead className="text-right eyebrow !text-muted-foreground">
                  Outlays
                </TableHead>
                <TableHead className="text-right eyebrow !text-muted-foreground">
                  Bills
                </TableHead>
                <TableHead className="text-right eyebrow !text-muted-foreground">
                  Net
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {series.map((p) => {
                const net = p.incomeCents - p.spendCents - p.billsCents;
                return (
                  <TableRow key={p.ym} className="border-border">
                    <TableCell className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                      {formatYearMonthShortLabel(p.ym).toLowerCase()}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums text-positive">
                      {formatCents(p.incomeCents)}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {formatCents(p.spendCents)}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {formatCents(p.billsCents)}
                    </TableCell>
                    <TableCell
                      className={`text-right font-mono tabular-nums ${
                        net >= 0 ? "text-positive" : "text-destructive"
                      }`}
                    >
                      {formatCents(net)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
