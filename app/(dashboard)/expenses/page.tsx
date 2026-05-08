import { Fragment } from "react";
import Link from "next/link";
import { PlusIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { format } from "date-fns";
import {
  listCashAccounts,
  listCategories,
  listExpensesForMonth,
} from "@/lib/queries";
import { centsToDollars, formatCents } from "@/lib/money";
import {
  currentYearMonth,
  formatYearMonthLabel,
  isValidYearMonth,
} from "@/lib/dates";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExpenseFormDialog } from "@/components/forms/expense-form";
import { PageHeader } from "@/components/page-header";
import { DeleteExpenseButton } from "./delete-button";

export const dynamic = "force-dynamic";

const OWNER_FILTERS = [
  { value: "all", label: "All" },
  { value: "tyler", label: "Tyler" },
  { value: "wife", label: "Michelle" },
  { value: "joint", label: "Joint" },
] as const;

type OwnerFilter = (typeof OWNER_FILTERS)[number]["value"];

function isOwnerFilter(value: string | undefined): value is OwnerFilter {
  return (
    value === "all" ||
    value === "tyler" ||
    value === "wife" ||
    value === "joint"
  );
}

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; owner?: string }>;
}) {
  const sp = await searchParams;
  const monthRaw = sp.month;
  const month =
    monthRaw && isValidYearMonth(monthRaw) ? monthRaw : currentYearMonth();
  const owner: OwnerFilter = isOwnerFilter(sp.owner) ? sp.owner : "all";
  const [categories, allExpenses, cashAccounts] = await Promise.all([
    listCategories(),
    listExpensesForMonth(month),
    listCashAccounts(),
  ]);
  const activeCategories = categories.filter((c) => !c.archived);
  const accountOptions = cashAccounts.map((a) => ({
    id: a.id,
    name: a.name,
    owner: a.owner,
  }));
  const accountNameById = new Map(cashAccounts.map((a) => [a.id, a.name]));
  const accountOwnerById = new Map(cashAccounts.map((a) => [a.id, a.owner]));
  const effectiveOwner = (e: { accountId: number | null; payer: string | null }) =>
    e.accountId != null ? accountOwnerById.get(e.accountId) ?? null : e.payer;
  const expenses =
    owner === "all"
      ? allExpenses
      : allExpenses.filter(({ expense }) => effectiveOwner(expense) === owner);
  const total = expenses.reduce(
    (sum, { expense }) => sum + expense.amountCents,
    0,
  );

  type ExpenseRow = (typeof expenses)[number];
  const dayGroups: Array<{
    date: string;
    total: number;
    items: ExpenseRow[];
  }> = [];
  const dayIndexByDate = new Map<string, number>();
  for (const item of expenses) {
    const d = item.expense.occurredOn;
    let idx = dayIndexByDate.get(d);
    if (idx === undefined) {
      idx = dayGroups.length;
      dayIndexByDate.set(d, idx);
      dayGroups.push({ date: d, total: 0, items: [] });
    }
    dayGroups[idx].items.push(item);
    dayGroups[idx].total += item.expense.amountCents;
  }

  return (
    <div className="flex flex-col gap-8 max-w-[1100px]">
      <PageHeader
        eyebrow="Folio II · Outlays"
        title="Expenses"
        subtitle={`Daily entries logged for ${formatYearMonthLabel(month)}.`}
        meta={
          <div className="flex flex-col items-end gap-0.5">
            <span className="font-mono text-base tabular-nums text-foreground">
              {formatCents(total)}
            </span>
            <span>
              {expenses.length} {expenses.length === 1 ? "entry" : "entries"}
            </span>
          </div>
        }
        action={
          <ExpenseFormDialog
            categories={activeCategories.map((c) => ({
              id: c.id,
              name: c.name,
            }))}
            accounts={accountOptions}
            trigger={
              <Button>
                <PlusIcon /> Log expense
              </Button>
            }
          />
        }
      />

      <div className="flex flex-wrap items-center gap-1 -mt-2">
        {OWNER_FILTERS.map((opt) => {
          const active = owner === opt.value;
          const params = new URLSearchParams();
          params.set("month", month);
          if (opt.value !== "all") params.set("owner", opt.value);
          const href = `/expenses${params.toString() ? `?${params.toString()}` : ""}`;
          return (
            <Link
              key={opt.value}
              href={href}
              scroll={false}
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                active
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:bg-muted/40 hover:text-foreground",
              )}
            >
              {opt.label}
            </Link>
          );
        })}
      </div>

      {expenses.length === 0 ? (
        <div className="rounded-lg border border-border py-12 text-center font-mono text-sm text-muted-foreground sm:hidden">
          — no expenses logged this month —
        </div>
      ) : (
        <div className="flex flex-col gap-5 sm:hidden">
          {dayGroups.map((group) => (
            <section key={group.date} className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2 px-1">
                <span className="text-sm font-medium tracking-tight text-foreground">
                  {format(new Date(group.date), "MMM d, EEE")}
                </span>
                <div className="flex items-center gap-1.5">
                  <Badge
                    variant="destructive"
                    className="text-[10px] uppercase tracking-wider"
                  >
                    OUT
                  </Badge>
                  <span className="font-mono text-sm tabular-nums text-foreground">
                    {formatCents(group.total)}
                  </span>
                </div>
              </div>
              <ul className="flex flex-col gap-2">
                {group.items.map(({ expense, category }) => (
                  <li key={expense.id}>
                    <ExpenseFormDialog
                      categories={activeCategories.map((c) => ({
                        id: c.id,
                        name: c.name,
                      }))}
                      accounts={accountOptions}
                      defaults={{
                        id: expense.id,
                        occurredOn: expense.occurredOn,
                        amount: centsToDollars(expense.amountCents),
                        categoryId: expense.categoryId,
                        accountId: expense.accountId,
                        payer: expense.payer,
                        description: expense.description,
                      }}
                      trigger={
                        <button
                          type="button"
                          className="flex w-full items-center justify-between gap-4 rounded-lg border border-border bg-card px-3 py-2.5 text-left transition-colors hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
                        >
                          <div className="flex min-w-0 flex-col gap-1">
                            <div className="truncate text-sm font-medium">
                              {expense.description || (
                                <span className="italic text-muted-foreground">
                                  unmarked
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                              {category ? (
                                <span className="inline-flex items-center gap-1.5 normal-case tracking-normal">
                                  <span
                                    className="size-1.5 rounded-full"
                                    style={{ backgroundColor: category.color }}
                                  />
                                  {category.name}
                                </span>
                              ) : null}
                              <span>
                                {expense.accountId != null
                                  ? (accountNameById.get(expense.accountId) ?? "—")
                                  : expense.payer === "wife"
                                    ? "michelle"
                                    : (expense.payer ?? "—")}
                              </span>
                            </div>
                          </div>
                          <div className="font-mono text-base tabular-nums shrink-0">
                            {formatCents(expense.amountCents)}
                          </div>
                        </button>
                      }
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <div className="hidden rounded-lg border border-border overflow-x-auto sm:block">
        <Table>
          <TableHeader>
            <TableRow className="border-border bg-muted/40">
              <TableHead className="eyebrow !text-muted-foreground">
                Description
              </TableHead>
              <TableHead className="eyebrow !text-muted-foreground">
                Category
              </TableHead>
              <TableHead className="eyebrow !text-muted-foreground">
                Account
              </TableHead>
              <TableHead className="text-right eyebrow !text-muted-foreground">
                Amount
              </TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground py-12 font-mono text-sm"
                >
                  — no expenses logged this month —
                </TableCell>
              </TableRow>
            ) : (
              dayGroups.map((group) => (
                <Fragment key={group.date}>
                  <TableRow className="border-border bg-muted/30 hover:bg-muted/30">
                    <TableCell colSpan={5} className="py-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium tracking-tight text-foreground">
                          {format(new Date(group.date), "MMM d, EEE")}
                        </span>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="destructive"
                            className="text-[10px] uppercase tracking-wider"
                          >
                            OUT
                          </Badge>
                          <span className="font-mono text-sm tabular-nums text-foreground">
                            {formatCents(group.total)}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                  {group.items.map(({ expense, category }) => (
                    <TableRow key={expense.id} className="border-border">
                      <TableCell>
                        {expense.description || (
                          <span className="text-muted-foreground italic">
                            unmarked
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {category ? (
                          <span className="inline-flex items-center gap-2">
                            <span
                              className="size-2 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            <span className="text-sm">{category.name}</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                        {expense.accountId != null
                          ? (accountNameById.get(expense.accountId) ?? "—")
                          : expense.payer === "wife"
                            ? "michelle"
                            : (expense.payer ?? "—")}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {formatCents(expense.amountCents)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <ExpenseFormDialog
                            categories={activeCategories.map((c) => ({
                              id: c.id,
                              name: c.name,
                            }))}
                            accounts={accountOptions}
                            defaults={{
                              id: expense.id,
                              occurredOn: expense.occurredOn,
                              amount: centsToDollars(expense.amountCents),
                              categoryId: expense.categoryId,
                              accountId: expense.accountId,
                              payer: expense.payer,
                              description: expense.description,
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
                          <DeleteExpenseButton id={expense.id}>
                            <Trash2Icon />
                          </DeleteExpenseButton>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
