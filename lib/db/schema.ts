import {
  pgTable,
  text,
  bigint,
  smallint,
  boolean,
  date,
  serial,
  uniqueIndex,
  integer,
} from "drizzle-orm/pg-core";

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  color: text("color").notNull().default("#64748b"),
  monthlyBudgetCents: bigint("monthly_budget_cents", { mode: "number" })
    .notNull()
    .default(0),
  archived: boolean("archived").notNull().default(false),
});

export const cashAccounts = pgTable("cash_accounts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  owner: text("owner").notNull(),
  openingBalanceCents: bigint("opening_balance_cents", { mode: "number" })
    .notNull()
    .default(0),
  openingAsOf: date("opening_as_of").notNull(),
  archived: boolean("archived").notNull().default(false),
});

export const transfers = pgTable("transfers", {
  id: serial("id").primaryKey(),
  fromAccountId: integer("from_account_id")
    .notNull()
    .references(() => cashAccounts.id, { onDelete: "cascade" }),
  toAccountId: integer("to_account_id")
    .notNull()
    .references(() => cashAccounts.id, { onDelete: "cascade" }),
  amountCents: bigint("amount_cents", { mode: "number" }).notNull(),
  occurredOn: date("occurred_on").notNull(),
  notes: text("notes").notNull().default(""),
});

export const incomeSources = pgTable("income_sources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  amountCents: bigint("amount_cents", { mode: "number" }).notNull(),
  payer: text("payer").notNull().default("joint"),
  accountId: integer("account_id").references(() => cashAccounts.id, {
    onDelete: "set null",
  }),
  startMonth: date("start_month").notNull(),
  endMonth: date("end_month"),
  notes: text("notes").notNull().default(""),
});

export const bills = pgTable("bills", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  amountCents: bigint("amount_cents", { mode: "number" }).notNull(),
  dueDay: smallint("due_day").notNull(),
  categoryId: integer("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  autopay: boolean("autopay").notNull().default(false),
  active: boolean("active").notNull().default(true),
  notes: text("notes").notNull().default(""),
});

export const billPayments = pgTable(
  "bill_payments",
  {
    id: serial("id").primaryKey(),
    billId: integer("bill_id")
      .notNull()
      .references(() => bills.id, { onDelete: "cascade" }),
    yearMonth: text("year_month").notNull(),
    paidOn: date("paid_on").notNull(),
    amountCents: bigint("amount_cents", { mode: "number" }).notNull(),
    accountId: integer("account_id").references(() => cashAccounts.id, {
      onDelete: "set null",
    }),
  },
  (t) => ({
    billMonthUnique: uniqueIndex("bill_payments_bill_month_idx").on(
      t.billId,
      t.yearMonth,
    ),
  }),
);

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  occurredOn: date("occurred_on").notNull(),
  amountCents: bigint("amount_cents", { mode: "number" }).notNull(),
  categoryId: integer("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  accountId: integer("account_id").references(() => cashAccounts.id, {
    onDelete: "set null",
  }),
  payer: text("payer"),
  description: text("description").notNull().default(""),
  notes: text("notes").notNull().default(""),
});

export const investmentAccounts = pgTable("investment_accounts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  kind: text("kind").notNull().default("brokerage"),
  owner: text("owner").notNull().default("joint"),
  archived: boolean("archived").notNull().default(false),
});

export const investmentBalances = pgTable(
  "investment_balances",
  {
    id: serial("id").primaryKey(),
    accountId: integer("account_id")
      .notNull()
      .references(() => investmentAccounts.id, { onDelete: "cascade" }),
    asOf: date("as_of").notNull(),
    balanceCents: bigint("balance_cents", { mode: "number" }).notNull(),
  },
  (t) => ({
    accountAsOfUnique: uniqueIndex("investment_balances_account_date_idx").on(
      t.accountId,
      t.asOf,
    ),
  }),
);

export type Category = typeof categories.$inferSelect;
export type IncomeSource = typeof incomeSources.$inferSelect;
export type Bill = typeof bills.$inferSelect;
export type BillPayment = typeof billPayments.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
export type InvestmentAccount = typeof investmentAccounts.$inferSelect;
export type InvestmentBalance = typeof investmentBalances.$inferSelect;
export type CashAccount = typeof cashAccounts.$inferSelect;
export type Transfer = typeof transfers.$inferSelect;
