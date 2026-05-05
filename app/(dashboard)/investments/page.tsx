import {
  PlusIcon,
  ArchiveIcon,
  ArchiveRestoreIcon,
  PencilIcon,
} from "lucide-react";
import { format } from "date-fns";
import {
  investmentTotalSeries,
  latestBalancePerAccount,
  listInvestmentAccounts,
  listInvestmentBalances,
} from "@/lib/queries";
import { formatCents } from "@/lib/money";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AccountFormDialog } from "@/components/forms/account-form";
import { BalanceFormDialog } from "@/components/forms/balance-form";
import { InvestmentTrendChart } from "@/components/charts/investment-trend";
import { PageHeader } from "@/components/page-header";
import { ArchiveAccountButton } from "./archive-button";
import { DeleteBalanceButton } from "./delete-balance-button";

export const dynamic = "force-dynamic";

const KIND_LABELS: Record<string, string> = {
  "401k": "401(k)",
  ira: "IRA",
  "roth-ira": "Roth IRA",
  brokerage: "Brokerage",
  hsa: "HSA",
  crypto: "Crypto",
  cash: "Cash",
  other: "Other",
};

export default async function InvestmentsPage() {
  const [accounts, latestBalances, balances, series] = await Promise.all([
    listInvestmentAccounts(),
    latestBalancePerAccount(),
    listInvestmentBalances(),
    investmentTotalSeries(),
  ]);

  const latestByAccount = new Map<
    number,
    { as_of: string | null; balance_cents: number | null }
  >();
  for (const row of latestBalances as Array<{
    account_id: number;
    as_of: string | null;
    balance_cents: number | null;
  }>) {
    latestByAccount.set(row.account_id, {
      as_of: row.as_of,
      balance_cents: row.balance_cents,
    });
  }

  const totalLatest = Array.from(latestByAccount.values()).reduce(
    (sum, b) => sum + (b.balance_cents ?? 0),
    0,
  );

  const accountOptions = accounts
    .filter((a) => !a.archived)
    .map((a) => ({ id: a.id, name: a.name }));

  return (
    <div className="flex flex-col gap-8 max-w-[1200px]">
      <PageHeader
        eyebrow="Folio V · Capital"
        title="Investments"
        subtitle="Periodic balance snapshots across all accounts."
        meta={
          <div className="flex flex-col items-end gap-0.5">
            <span className="font-mono text-base tabular-nums text-accent">
              {formatCents(totalLatest)}
            </span>
            <span>combined latest</span>
          </div>
        }
        action={
          <div className="flex gap-2">
            <AccountFormDialog
              trigger={
                <Button variant="outline">
                  <PlusIcon /> Account
                </Button>
              }
            />
            <BalanceFormDialog
              accounts={accountOptions}
              trigger={
                <Button disabled={accountOptions.length === 0}>
                  <PlusIcon /> Log balance
                </Button>
              }
            />
          </div>
        }
      />

      <section className="rounded-xl border border-border bg-card p-4 sm:p-6 flex flex-col gap-4 sm:gap-5">
        <header className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 sm:gap-4 pb-3 border-b border-dashed border-border">
          <div className="flex items-baseline gap-3">
            <span className="eyebrow">Trend</span>
            <h3 className="font-display text-base sm:text-lg tracking-tight">
              Combined value, by date logged
            </h3>
          </div>
          <span className="font-mono text-[10px] sm:text-[11px] text-muted-foreground">
            sum of latest known balance per account
          </span>
        </header>
        <InvestmentTrendChart
          data={series as Array<{ as_of: string; total_cents: number }>}
        />
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline gap-3">
          <p className="eyebrow">Accounts</p>
          <span className="h-px flex-1 bg-border" />
        </div>
        {accounts.length === 0 ? (
          <div className="rounded-lg border border-border py-12 text-center font-mono text-sm text-muted-foreground sm:hidden">
            — no accounts yet —
          </div>
        ) : (
          <ul className="flex flex-col gap-3 sm:hidden">
            {accounts.map((a) => {
              const latest = latestByAccount.get(a.id);
              return (
                <li
                  key={a.id}
                  className={`flex flex-col gap-4 rounded-lg border border-border bg-card p-4 ${a.archived ? "opacity-50" : ""}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 flex-col gap-2">
                      <div className="truncate font-medium">
                        {a.name}
                        {a.archived ? (
                          <span className="ml-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                            retired
                          </span>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                        <span>{KIND_LABELS[a.kind] ?? a.kind}</span>
                        <span>{a.owner}</span>
                        {latest?.as_of ? (
                          <span className="tabular-nums normal-case tracking-normal">
                            {format(
                              new Date(latest.as_of),
                              "MMM d, yyyy",
                            ).toLowerCase()}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="font-mono text-lg tabular-nums shrink-0">
                      {latest?.balance_cents != null
                        ? formatCents(latest.balance_cents)
                        : "—"}
                    </div>
                  </div>
                  <div className="flex justify-end gap-1">
                    <AccountFormDialog
                      defaults={{
                        id: a.id,
                        name: a.name,
                        kind: a.kind,
                        owner: a.owner,
                      }}
                      trigger={
                        <Button variant="ghost" size="icon-sm" aria-label="Edit">
                          <PencilIcon />
                        </Button>
                      }
                    />
                    <ArchiveAccountButton id={a.id} archived={a.archived}>
                      {a.archived ? <ArchiveRestoreIcon /> : <ArchiveIcon />}
                    </ArchiveAccountButton>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <div className="hidden rounded-lg border border-border overflow-x-auto sm:block">
          <Table>
            <TableHeader>
              <TableRow className="border-border bg-muted/40">
                <TableHead className="eyebrow !text-muted-foreground">
                  Name
                </TableHead>
                <TableHead className="eyebrow !text-muted-foreground">
                  Type
                </TableHead>
                <TableHead className="eyebrow !text-muted-foreground">
                  Owner
                </TableHead>
                <TableHead className="text-right eyebrow !text-muted-foreground">
                  Latest balance
                </TableHead>
                <TableHead className="eyebrow !text-muted-foreground">
                  As of
                </TableHead>
                <TableHead className="w-32 text-right eyebrow !text-muted-foreground">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground py-12 font-mono text-sm"
                  >
                    — no accounts yet —
                  </TableCell>
                </TableRow>
              ) : (
                accounts.map((a) => {
                  const latest = latestByAccount.get(a.id);
                  return (
                    <TableRow
                      key={a.id}
                      className={`border-border ${a.archived ? "opacity-50" : ""}`}
                    >
                      <TableCell>
                        {a.name}
                        {a.archived ? (
                          <span className="ml-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                            retired
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                        {KIND_LABELS[a.kind] ?? a.kind}
                      </TableCell>
                      <TableCell className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                        {a.owner}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {latest?.balance_cents != null
                          ? formatCents(latest.balance_cents)
                          : "—"}
                      </TableCell>
                      <TableCell className="font-mono text-xs tabular-nums text-muted-foreground">
                        {latest?.as_of
                          ? format(
                              new Date(latest.as_of),
                              "MMM d, yyyy",
                            ).toLowerCase()
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <AccountFormDialog
                            defaults={{
                              id: a.id,
                              name: a.name,
                              kind: a.kind,
                              owner: a.owner,
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
                          <ArchiveAccountButton
                            id={a.id}
                            archived={a.archived}
                          >
                            {a.archived ? (
                              <ArchiveRestoreIcon />
                            ) : (
                              <ArchiveIcon />
                            )}
                          </ArchiveAccountButton>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline gap-3">
          <p className="eyebrow">Recent entries</p>
          <span className="h-px flex-1 bg-border" />
        </div>
        {balances.length === 0 ? (
          <div className="rounded-lg border border-border py-12 text-center font-mono text-sm text-muted-foreground sm:hidden">
            — no balances logged —
          </div>
        ) : (
          <ul className="flex flex-col rounded-lg border border-border bg-card divide-y divide-border overflow-hidden sm:hidden">
            {balances.slice(0, 25).map(({ balance, account }) => (
              <li
                key={balance.id}
                className="flex items-center gap-4 px-4 py-3"
              >
                <span className="font-mono tabular-nums text-xs text-muted-foreground shrink-0 w-16">
                  {format(new Date(balance.asOf), "MMM d").toLowerCase()}
                </span>
                <span className="flex-1 min-w-0 truncate text-sm">
                  {account.name}
                </span>
                <span className="font-mono tabular-nums text-xs shrink-0">
                  {formatCents(balance.balanceCents)}
                </span>
                <DeleteBalanceButton id={balance.id} />
              </li>
            ))}
          </ul>
        )}
        <div className="hidden rounded-lg border border-border overflow-x-auto sm:block">
          <Table>
            <TableHeader>
              <TableRow className="border-border bg-muted/40">
                <TableHead className="eyebrow !text-muted-foreground">
                  As of
                </TableHead>
                <TableHead className="eyebrow !text-muted-foreground">
                  Account
                </TableHead>
                <TableHead className="text-right eyebrow !text-muted-foreground">
                  Balance
                </TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {balances.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-muted-foreground py-12 font-mono text-sm"
                  >
                    — no balances logged —
                  </TableCell>
                </TableRow>
              ) : (
                balances.slice(0, 25).map(({ balance, account }) => (
                  <TableRow key={balance.id} className="border-border">
                    <TableCell className="font-mono text-xs tabular-nums text-muted-foreground">
                      {format(
                        new Date(balance.asOf),
                        "MMM d, yyyy",
                      ).toLowerCase()}
                    </TableCell>
                    <TableCell>{account.name}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {formatCents(balance.balanceCents)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <DeleteBalanceButton id={balance.id} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
