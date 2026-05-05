import { PlusIcon, PencilIcon, Trash2Icon, ZapIcon } from "lucide-react";
import {
  billsWithPaymentStatus,
  listBills,
  listCashAccounts,
  listCategories,
} from "@/lib/queries";
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
import { BillFormDialog } from "@/components/forms/bill-form";
import { PageHeader } from "@/components/page-header";
import { PaidToggle } from "./paid-toggle";
import { DeleteBillButton } from "./delete-button";

export const dynamic = "force-dynamic";

export default async function BillsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const sp = await searchParams;
  const monthRaw = sp.month;
  const month =
    monthRaw && isValidYearMonth(monthRaw) ? monthRaw : currentYearMonth();
  const [allBills, withStatus, categories, cashAccounts] = await Promise.all([
    listBills(),
    billsWithPaymentStatus(month),
    listCategories(),
    listCashAccounts(),
  ]);
  const defaultAccountId =
    cashAccounts.find((a) => a.owner === "joint")?.id ??
    cashAccounts[0]?.id ??
    null;
  const activeCategories = categories.filter((c) => !c.archived);
  const categoriesById = new Map(categories.map((c) => [c.id, c]));
  const total = withStatus.reduce((sum, { bill }) => sum + bill.amountCents, 0);
  const paidTotal = withStatus
    .filter(({ payment }) => payment)
    .reduce((sum, { bill }) => sum + bill.amountCents, 0);
  const inactiveBills = allBills.filter((b) => !b.active);
  const monthLabel = formatYearMonthLabel(month);

  const categoryOptions = activeCategories.map((c) => ({
    id: c.id,
    name: c.name,
  }));

  return (
    <div className="flex flex-col gap-8 max-w-[1100px]">
      <PageHeader
        eyebrow="Folio III · Obligations"
        title="Bills"
        subtitle={`Recurring obligations for ${monthLabel}.`}
        meta={
          <div className="flex flex-col items-end gap-0.5">
            <span className="font-mono text-base tabular-nums">
              <span className="text-positive">{formatCents(paidTotal)}</span>
              <span className="text-muted-foreground"> of </span>
              <span>{formatCents(total)}</span>
            </span>
            <span>{withStatus.length} active</span>
          </div>
        }
        action={
          <BillFormDialog
            categories={categoryOptions}
            trigger={
              <Button>
                <PlusIcon /> New bill
              </Button>
            }
          />
        }
      />

      {/* Mobile: compact rows */}
      <ul className="md:hidden flex flex-col rounded-lg border border-border bg-card divide-y divide-border overflow-hidden">
        {withStatus.length === 0 ? (
          <li className="py-10 text-center text-muted-foreground font-mono text-sm">
            — no active bills —
          </li>
        ) : (
          withStatus.map(({ bill, payment }) => {
            const category = bill.categoryId
              ? categoriesById.get(bill.categoryId)
              : null;
            return (
              <li
                key={bill.id}
                className="px-3 py-2 flex items-center gap-2.5"
              >
                <span className="font-mono tabular-nums text-xs w-6 text-center text-muted-foreground shrink-0">
                  {bill.dueDay.toString().padStart(2, "0")}
                </span>
                {category ? (
                  <span
                    className="size-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: category.color }}
                    aria-label={category.name}
                  />
                ) : null}
                <span className="flex-1 min-w-0 truncate text-sm flex items-center gap-1.5">
                  {bill.name}
                  {bill.autopay ? (
                    <ZapIcon className="size-3 text-accent shrink-0" />
                  ) : null}
                </span>
                <span className="font-mono tabular-nums text-xs shrink-0">
                  {formatCents(bill.amountCents)}
                </span>
                <PaidToggle
                  billId={bill.id}
                  yearMonth={month}
                  amountCents={bill.amountCents}
                  paid={Boolean(payment)}
                  accountId={payment?.accountId ?? null}
                  defaultAccountId={defaultAccountId}
                  className="shrink-0"
                />
                <BillFormDialog
                  categories={categoryOptions}
                  defaults={{
                    id: bill.id,
                    name: bill.name,
                    amount: centsToDollars(bill.amountCents),
                    dueDay: bill.dueDay,
                    categoryId: bill.categoryId,
                    autopay: bill.autopay,
                    active: bill.active,
                    notes: bill.notes,
                  }}
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Edit"
                      className="shrink-0"
                    >
                      <PencilIcon />
                    </Button>
                  }
                />
                <DeleteBillButton id={bill.id}>
                  <Trash2Icon />
                </DeleteBillButton>
              </li>
            );
          })
        )}
      </ul>

      {/* Desktop / tablet: table */}
      <div className="hidden md:block rounded-lg border border-border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border bg-muted/40">
              <TableHead className="w-16 text-center eyebrow !text-muted-foreground">
                Day
              </TableHead>
              <TableHead className="eyebrow !text-muted-foreground">
                Bill
              </TableHead>
              <TableHead className="eyebrow !text-muted-foreground">
                Category
              </TableHead>
              <TableHead className="text-right eyebrow !text-muted-foreground">
                Amount
              </TableHead>
              <TableHead className="w-40 text-center eyebrow !text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {withStatus.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground py-12 font-mono text-sm"
                >
                  — no active bills —
                </TableCell>
              </TableRow>
            ) : (
              withStatus.map(({ bill, payment }) => {
                const category = bill.categoryId
                  ? categoriesById.get(bill.categoryId)
                  : null;
                return (
                  <TableRow key={bill.id} className="border-border">
                    <TableCell className="text-center font-mono tabular-nums text-sm">
                      {bill.dueDay.toString().padStart(2, "0")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{bill.name}</span>
                        {bill.autopay ? (
                          <span
                            className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-accent"
                            title="autopay"
                          >
                            <ZapIcon className="size-3" />
                            auto
                          </span>
                        ) : null}
                      </div>
                      {bill.notes ? (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {bill.notes}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      {category ? (
                        <span className="inline-flex items-center gap-2 text-sm">
                          <span
                            className="size-2 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          {category.name}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {formatCents(bill.amountCents)}
                    </TableCell>
                    <TableCell className="text-center">
                      <PaidToggle
                        billId={bill.id}
                        yearMonth={month}
                        amountCents={bill.amountCents}
                        paid={Boolean(payment)}
                        accountId={payment?.accountId ?? null}
                        defaultAccountId={defaultAccountId}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <BillFormDialog
                          categories={categoryOptions}
                          defaults={{
                            id: bill.id,
                            name: bill.name,
                            amount: centsToDollars(bill.amountCents),
                            dueDay: bill.dueDay,
                            categoryId: bill.categoryId,
                            autopay: bill.autopay,
                            active: bill.active,
                            notes: bill.notes,
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
                        <DeleteBillButton id={bill.id}>
                          <Trash2Icon />
                        </DeleteBillButton>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {inactiveBills.length > 0 ? (
        <section className="flex flex-col gap-3">
          <div className="flex items-baseline gap-3">
            <p className="eyebrow">Retired</p>
            <span className="h-px flex-1 bg-border" />
          </div>

          {/* Mobile inactive list */}
          <ul className="md:hidden flex flex-col gap-2">
            {inactiveBills.map((bill) => (
              <li
                key={bill.id}
                className="rounded-lg border border-border bg-card px-4 py-3 flex items-center gap-3 opacity-60"
              >
                <span className="font-mono tabular-nums text-sm w-7 text-center">
                  {bill.dueDay.toString().padStart(2, "0")}
                </span>
                <span className="flex-1 min-w-0 truncate text-sm">
                  {bill.name}
                </span>
                <span className="font-mono tabular-nums text-xs text-muted-foreground">
                  {formatCents(bill.amountCents)}
                </span>
                <BillFormDialog
                  categories={categoryOptions}
                  defaults={{
                    id: bill.id,
                    name: bill.name,
                    amount: centsToDollars(bill.amountCents),
                    dueDay: bill.dueDay,
                    categoryId: bill.categoryId,
                    autopay: bill.autopay,
                    active: bill.active,
                    notes: bill.notes,
                  }}
                  trigger={
                    <Button variant="ghost" size="icon-sm" aria-label="Edit">
                      <PencilIcon />
                    </Button>
                  }
                />
              </li>
            ))}
          </ul>

          {/* Desktop inactive table */}
          <div className="hidden md:block rounded-lg border border-border overflow-x-auto">
            <Table>
              <TableBody>
                {inactiveBills.map((bill) => (
                  <TableRow key={bill.id} className="border-border opacity-60">
                    <TableCell className="w-16 text-center font-mono tabular-nums text-sm">
                      {bill.dueDay.toString().padStart(2, "0")}
                    </TableCell>
                    <TableCell>{bill.name}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {formatCents(bill.amountCents)}
                    </TableCell>
                    <TableCell className="w-20">
                      <div className="flex justify-end">
                        <BillFormDialog
                          categories={categoryOptions}
                          defaults={{
                            id: bill.id,
                            name: bill.name,
                            amount: centsToDollars(bill.amountCents),
                            dueDay: bill.dueDay,
                            categoryId: bill.categoryId,
                            autopay: bill.autopay,
                            active: bill.active,
                            notes: bill.notes,
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
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
