import {
  PlusIcon,
  ArchiveIcon,
  ArchiveRestoreIcon,
  PencilIcon,
} from "lucide-react";
import { listCategories } from "@/lib/queries";
import { centsToDollars, formatCents } from "@/lib/money";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CategoryFormDialog } from "@/components/forms/category-form";
import { PageHeader } from "@/components/page-header";
import { ArchiveButton } from "./archive-button";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await listCategories();
  const totalBudget = categories
    .filter((c) => !c.archived)
    .reduce((sum, c) => sum + c.monthlyBudgetCents, 0);

  return (
    <div className="flex flex-col gap-8 max-w-[900px]">
      <PageHeader
        eyebrow="Folio VI · Buckets"
        title="Categories"
        subtitle="Tags applied to expenses, with optional monthly allowances."
        meta={
          <div className="flex flex-col items-end gap-0.5">
            <span className="font-mono text-base tabular-nums">
              {formatCents(totalBudget)}
            </span>
            <span>monthly allowance</span>
          </div>
        }
        action={
          <CategoryFormDialog
            trigger={
              <Button>
                <PlusIcon /> New category
              </Button>
            }
          />
        }
      />

      <div className="rounded-lg border border-border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border bg-muted/40">
              <TableHead className="w-12" />
              <TableHead className="eyebrow !text-muted-foreground">
                Name
              </TableHead>
              <TableHead className="text-right eyebrow !text-muted-foreground">
                Allowance
              </TableHead>
              <TableHead className="w-32 text-right eyebrow !text-muted-foreground">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground py-12 font-mono text-sm"
                >
                  — no categories yet, draft your first —
                </TableCell>
              </TableRow>
            ) : (
              categories.map((c) => (
                <TableRow
                  key={c.id}
                  className={`border-border ${c.archived ? "opacity-50" : ""}`}
                >
                  <TableCell>
                    <span
                      className="inline-block size-3 rounded-full ring-1 ring-border"
                      style={{ backgroundColor: c.color }}
                    />
                  </TableCell>
                  <TableCell>
                    {c.name}
                    {c.archived ? (
                      <span className="ml-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        retired
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {c.monthlyBudgetCents > 0 ? (
                      formatCents(c.monthlyBudgetCents)
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <CategoryFormDialog
                        defaults={{
                          id: c.id,
                          name: c.name,
                          color: c.color,
                          monthlyBudget: centsToDollars(c.monthlyBudgetCents),
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
                      <ArchiveButton id={c.id} archived={c.archived}>
                        {c.archived ? (
                          <ArchiveRestoreIcon />
                        ) : (
                          <ArchiveIcon />
                        )}
                      </ArchiveButton>
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
