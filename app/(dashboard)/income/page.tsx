import { PlusIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { format } from "date-fns";
import { listIncomeSources, activeIncomeForMonth } from "@/lib/queries";
import { centsToDollars, formatCents } from "@/lib/money";
import {
  currentYearMonth,
  formatYearMonthLabel,
  isValidYearMonth,
} from "@/lib/dates";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { IncomeFormDialog } from "@/components/forms/income-form";
import { PageHeader } from "@/components/page-header";
import { DeleteIncomeButton } from "./delete-button";

export const dynamic = "force-dynamic";

export default async function IncomePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const sp = await searchParams;
  const monthRaw = sp.month;
  const month =
    monthRaw && isValidYearMonth(monthRaw) ? monthRaw : currentYearMonth();
  const [all, active] = await Promise.all([
    listIncomeSources(),
    activeIncomeForMonth(month),
  ]);
  const activeIds = new Set(active.map((i) => i.id));
  const monthlyTotal = active.reduce((sum, i) => sum + i.amountCents, 0);

  return (
    <div className="flex flex-col gap-8 max-w-[1100px]">
      <PageHeader
        eyebrow="Folio IV · Earnings"
        title="Income"
        subtitle={`Recurring inflows for ${formatYearMonthLabel(month)}.`}
        meta={
          <div className="flex flex-col items-end gap-0.5">
            <span className="font-mono text-base tabular-nums text-positive">
              {formatCents(monthlyTotal)}
            </span>
            <span>
              {active.length} of {all.length} active
            </span>
          </div>
        }
        action={
          <IncomeFormDialog
            trigger={
              <Button>
                <PlusIcon /> New source
              </Button>
            }
          />
        }
      />

      <div className="rounded-lg border border-border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border bg-muted/40">
              <TableHead className="eyebrow !text-muted-foreground">
                Source
              </TableHead>
              <TableHead className="eyebrow !text-muted-foreground">
                Earner
              </TableHead>
              <TableHead className="eyebrow !text-muted-foreground">
                Window
              </TableHead>
              <TableHead className="text-right eyebrow !text-muted-foreground">
                Monthly
              </TableHead>
              <TableHead className="text-center eyebrow !text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {all.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground py-12 font-mono text-sm"
                >
                  — no income sources yet —
                </TableCell>
              </TableRow>
            ) : (
              all.map((i) => (
                <TableRow key={i.id} className="border-border">
                  <TableCell>
                    <div>{i.name}</div>
                    {i.notes ? (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {i.notes}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    {i.payer}
                  </TableCell>
                  <TableCell className="font-mono text-xs tabular-nums text-muted-foreground">
                    {format(new Date(i.startMonth), "MMM yyyy").toLowerCase()}
                    <span className="px-1.5">→</span>
                    {i.endMonth
                      ? format(new Date(i.endMonth), "MMM yyyy").toLowerCase()
                      : "ongoing"}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {formatCents(i.amountCents)}
                  </TableCell>
                  <TableCell className="text-center">
                    {activeIds.has(i.id) ? (
                      <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-positive">
                        active
                      </span>
                    ) : (
                      <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                        dormant
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <IncomeFormDialog
                        defaults={{
                          id: i.id,
                          name: i.name,
                          amount: centsToDollars(i.amountCents),
                          payer: i.payer as "tyler" | "wife" | "joint",
                          startMonth: i.startMonth.slice(0, 7),
                          endMonth: i.endMonth ? i.endMonth.slice(0, 7) : null,
                          notes: i.notes,
                        }}
                        trigger={
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Edit"
                          >
                            <PencilIcon />
                          </Button>
                        }
                      />
                      <DeleteIncomeButton id={i.id}>
                        <Trash2Icon />
                      </DeleteIncomeButton>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
