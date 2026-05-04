import { PlusIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { format } from "date-fns";
import { listCategories, listExpensesForMonth } from "@/lib/queries";
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
import { ExpenseFormDialog } from "@/components/forms/expense-form";
import { PageHeader } from "@/components/page-header";
import { DeleteExpenseButton } from "./delete-button";

export const dynamic = "force-dynamic";

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const sp = await searchParams;
  const monthRaw = sp.month;
  const month =
    monthRaw && isValidYearMonth(monthRaw) ? monthRaw : currentYearMonth();
  const [categories, expenses] = await Promise.all([
    listCategories(),
    listExpensesForMonth(month),
  ]);
  const activeCategories = categories.filter((c) => !c.archived);
  const total = expenses.reduce(
    (sum, { expense }) => sum + expense.amountCents,
    0,
  );

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
            trigger={
              <Button>
                <PlusIcon /> Log expense
              </Button>
            }
          />
        }
      />

      <div className="rounded-lg border border-border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border bg-muted/40">
              <TableHead className="w-24 eyebrow !text-muted-foreground">
                Date
              </TableHead>
              <TableHead className="eyebrow !text-muted-foreground">
                Description
              </TableHead>
              <TableHead className="eyebrow !text-muted-foreground">
                Category
              </TableHead>
              <TableHead className="eyebrow !text-muted-foreground">
                Paid by
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
                  colSpan={6}
                  className="text-center text-muted-foreground py-12 font-mono text-sm"
                >
                  — no expenses logged this month —
                </TableCell>
              </TableRow>
            ) : (
              expenses.map(({ expense, category }) => (
                <TableRow key={expense.id} className="border-border">
                  <TableCell className="font-mono text-xs tabular-nums text-muted-foreground">
                    {format(new Date(expense.occurredOn), "MMM d").toLowerCase()}
                  </TableCell>
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
                    {expense.payer === "wife" ? "michelle" : (expense.payer ?? "—")}
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
                        defaults={{
                          id: expense.id,
                          occurredOn: expense.occurredOn,
                          amount: centsToDollars(expense.amountCents),
                          categoryId: expense.categoryId,
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
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
