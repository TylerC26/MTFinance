import { ArrowRightIcon, PencilIcon, PlusIcon } from "lucide-react";
import { format } from "date-fns";
import {
  getAccountBalances,
  listTransfers,
} from "@/lib/db/queries/account-balance";
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
import { CashAccountFormDialog } from "@/components/forms/cash-account-form";
import { TransferFormDialog } from "@/components/forms/transfer-form";
import { PageHeader } from "@/components/page-header";
import { DeleteTransferButton } from "./delete-transfer-button";

export const dynamic = "force-dynamic";

const OWNER_LABEL: Record<string, string> = {
  tyler: "Tyler",
  wife: "Michelle",
  joint: "Joint",
};

export default async function AccountsPage() {
  const [balances, transfers] = await Promise.all([
    getAccountBalances(),
    listTransfers(),
  ]);

  const totalCents = balances.reduce((sum, b) => sum + b.balanceCents, 0);
  const accountOptions = balances.map((b) => ({
    id: b.id,
    name: b.name,
    owner: b.owner,
  }));

  return (
    <div className="flex flex-col gap-8 max-w-[1200px]">
      <PageHeader
        eyebrow="Folio V · Cash"
        title="Accounts"
        subtitle="Cash on hand for Tyler, Michelle, and Joint — including transfers between them."
        meta={
          <div className="flex flex-col items-end gap-0.5">
            <span className="font-mono text-base tabular-nums text-accent">
              {formatCents(totalCents)}
            </span>
            <span>combined cash</span>
          </div>
        }
        action={
          <TransferFormDialog
            accounts={accountOptions}
            trigger={
              <Button disabled={accountOptions.length < 2}>
                <PlusIcon /> Log transfer
              </Button>
            }
          />
        }
      />

      <section className="grid gap-4 sm:grid-cols-3">
        {balances.map((b) => (
          <article
            key={b.id}
            className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-1">
                <span className="eyebrow">{OWNER_LABEL[b.owner] ?? b.owner}</span>
                <h2 className="truncate font-display text-lg tracking-tight">
                  {b.name}
                </h2>
              </div>
              <CashAccountFormDialog
                defaults={{
                  id: b.id,
                  name: b.name,
                  owner: b.owner,
                  openingBalance: centsToDollars(b.openingBalanceCents),
                  openingAsOf: b.openingAsOf,
                }}
                trigger={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Edit account"
                    className="-mr-2 shrink-0"
                  >
                    <PencilIcon />
                  </Button>
                }
              />
            </div>
            <div className="font-mono text-3xl tabular-nums">
              {formatCents(b.balanceCents)}
            </div>
            <dl className="flex flex-col gap-1.5 font-mono text-[11px] text-muted-foreground">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="shrink-0">Opening</dt>
                <dd className="tabular-nums text-right">
                  {formatCents(b.openingBalanceCents)}
                  <span className="ml-1 opacity-70">
                    · {format(new Date(b.openingAsOf), "MMM d").toLowerCase()}
                  </span>
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="shrink-0">+ income (est.)</dt>
                <dd className="tabular-nums">
                  {formatCents(b.estimatedIncomeCents)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="shrink-0">+ transfers in</dt>
                <dd className="tabular-nums">
                  {formatCents(b.transfersInCents)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="shrink-0">− transfers out</dt>
                <dd className="tabular-nums">
                  {formatCents(b.transfersOutCents)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="shrink-0">− expenses</dt>
                <dd className="tabular-nums">{formatCents(b.expensesCents)}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="shrink-0">− bills paid</dt>
                <dd className="tabular-nums">
                  {formatCents(b.billPaymentsCents)}
                </dd>
              </div>
            </dl>
          </article>
        ))}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline gap-3">
          <p className="eyebrow">Transfers</p>
          <span className="h-px flex-1 bg-border" />
        </div>
        {transfers.length === 0 ? (
          <div className="rounded-lg border border-border py-12 text-center font-mono text-sm text-muted-foreground">
            — no transfers logged —
          </div>
        ) : (
          <>
            <ul className="flex flex-col rounded-lg border border-border bg-card divide-y divide-border overflow-hidden sm:hidden">
              {transfers.slice(0, 50).map((t) => (
                <li key={t.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="font-mono tabular-nums text-xs text-muted-foreground shrink-0 w-14">
                    {format(new Date(t.occurredOn), "MMM d").toLowerCase()}
                  </span>
                  <span className="flex min-w-0 flex-1 items-center gap-1 text-sm">
                    <span className="truncate">{t.fromName}</span>
                    <ArrowRightIcon className="size-3 shrink-0 text-muted-foreground" />
                    <span className="truncate">{t.toName}</span>
                  </span>
                  <span className="font-mono tabular-nums text-sm shrink-0">
                    {formatCents(t.amountCents)}
                  </span>
                  <DeleteTransferButton id={t.id} />
                </li>
              ))}
            </ul>
            <div className="hidden rounded-lg border border-border overflow-x-auto sm:block">
              <Table>
                <TableHeader>
                  <TableRow className="border-border bg-muted/40">
                    <TableHead className="eyebrow !text-muted-foreground">Date</TableHead>
                    <TableHead className="eyebrow !text-muted-foreground">From</TableHead>
                    <TableHead className="eyebrow !text-muted-foreground">To</TableHead>
                    <TableHead className="text-right eyebrow !text-muted-foreground">Amount</TableHead>
                    <TableHead className="eyebrow !text-muted-foreground">Notes</TableHead>
                    <TableHead className="w-16" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transfers.slice(0, 50).map((t) => (
                    <TableRow key={t.id} className="border-border">
                      <TableCell className="font-mono text-xs tabular-nums text-muted-foreground">
                        {format(new Date(t.occurredOn), "MMM d, yyyy").toLowerCase()}
                      </TableCell>
                      <TableCell>{t.fromName}</TableCell>
                      <TableCell>{t.toName}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {formatCents(t.amountCents)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {t.notes || "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end">
                          <DeleteTransferButton id={t.id} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
