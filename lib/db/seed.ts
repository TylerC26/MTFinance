import { format, addDays, subMonths, startOfMonth } from "date-fns";
import * as schema from "./schema";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

type DB = NodePgDatabase<typeof schema>;

function iso(d: Date) {
  return format(d, "yyyy-MM-dd");
}

export async function runSeed(db: DB) {
  const today = new Date();
  const startOfThisMonth = startOfMonth(today);

  const categoryDefs = [
    { name: "Groceries", color: "#22c55e", monthlyBudgetCents: 80000 },
    { name: "Dining", color: "#f97316", monthlyBudgetCents: 40000 },
    { name: "Utilities", color: "#3b82f6", monthlyBudgetCents: 35000 },
    { name: "Transport", color: "#a855f7", monthlyBudgetCents: 25000 },
    { name: "Subscriptions", color: "#ec4899", monthlyBudgetCents: 12000 },
    { name: "Health", color: "#ef4444", monthlyBudgetCents: 30000 },
    { name: "Shopping", color: "#eab308", monthlyBudgetCents: 20000 },
    { name: "Misc", color: "#94a3b8", monthlyBudgetCents: 15000 },
  ];
  const categories = await db
    .insert(schema.categories)
    .values(categoryDefs)
    .returning();
  const catByName = new Map(categories.map((c) => [c.name, c.id]));

  await db.insert(schema.incomeSources).values([
    {
      name: "Tyler — salary",
      amountCents: 850000,
      payer: "tyler",
      startMonth: iso(subMonths(startOfThisMonth, 12)),
      endMonth: null,
      notes: "Bi-monthly direct deposit",
    },
    {
      name: "Wife — salary",
      amountCents: 720000,
      payer: "wife",
      startMonth: iso(subMonths(startOfThisMonth, 9)),
      endMonth: null,
      notes: "",
    },
    {
      name: "Side consulting",
      amountCents: 150000,
      payer: "joint",
      startMonth: iso(subMonths(startOfThisMonth, 4)),
      endMonth: null,
      notes: "Variable; rough monthly avg",
    },
  ]);

  const bills = await db
    .insert(schema.bills)
    .values([
      {
        name: "Rent",
        amountCents: 285000,
        dueDay: 1,
        categoryId: null,
        autopay: false,
        active: true,
        notes: "Wire by EOM",
      },
      {
        name: "Electric",
        amountCents: 11500,
        dueDay: 12,
        categoryId: catByName.get("Utilities") ?? null,
        autopay: true,
        active: true,
        notes: "",
      },
      {
        name: "Internet",
        amountCents: 7500,
        dueDay: 8,
        categoryId: catByName.get("Utilities") ?? null,
        autopay: true,
        active: true,
        notes: "",
      },
      {
        name: "Phone",
        amountCents: 9000,
        dueDay: 20,
        categoryId: catByName.get("Utilities") ?? null,
        autopay: true,
        active: true,
        notes: "Joint family plan",
      },
      {
        name: "Gym",
        amountCents: 4500,
        dueDay: 5,
        categoryId: catByName.get("Health") ?? null,
        autopay: true,
        active: true,
        notes: "",
      },
      {
        name: "Streaming bundle",
        amountCents: 3200,
        dueDay: 15,
        categoryId: catByName.get("Subscriptions") ?? null,
        autopay: true,
        active: true,
        notes: "Netflix + Spotify family",
      },
    ])
    .returning();

  // Mark most bills paid for the last 3 months
  const billPaymentRows: Array<{
    billId: number;
    yearMonth: string;
    paidOn: string;
    amountCents: number;
  }> = [];
  for (let m = 0; m < 3; m++) {
    const ymDate = subMonths(startOfThisMonth, m);
    const ym = format(ymDate, "yyyy-MM");
    for (const bill of bills) {
      // current month: skip Rent (still due) to show "unpaid" UI
      if (m === 0 && bill.name === "Rent") continue;
      billPaymentRows.push({
        billId: bill.id,
        yearMonth: ym,
        paidOn: iso(addDays(ymDate, bill.dueDay - 1)),
        amountCents: bill.amountCents,
      });
    }
  }
  if (billPaymentRows.length > 0) {
    await db.insert(schema.billPayments).values(billPaymentRows);
  }

  // Sample expenses for last 3 months
  const sampleExpenses: Array<{
    daysBack: number;
    amount: number;
    cat: string;
    payer: string;
    description: string;
  }> = [
    { daysBack: 1, amount: 4823, cat: "Groceries", payer: "wife", description: "Whole Foods" },
    { daysBack: 2, amount: 1450, cat: "Dining", payer: "tyler", description: "Sushi delivery" },
    { daysBack: 3, amount: 2780, cat: "Groceries", payer: "tyler", description: "Trader Joe's" },
    { daysBack: 5, amount: 980, cat: "Transport", payer: "tyler", description: "Uber" },
    { daysBack: 6, amount: 2999, cat: "Shopping", payer: "wife", description: "Target run" },
    { daysBack: 7, amount: 3500, cat: "Dining", payer: "joint", description: "Anniversary dinner" },
    { daysBack: 9, amount: 1240, cat: "Groceries", payer: "wife", description: "Local market" },
    { daysBack: 10, amount: 4500, cat: "Health", payer: "tyler", description: "Pharmacy" },
    { daysBack: 12, amount: 800, cat: "Misc", payer: "joint", description: "Coffee shop" },
    { daysBack: 14, amount: 6200, cat: "Groceries", payer: "wife", description: "Costco" },
    { daysBack: 15, amount: 1850, cat: "Dining", payer: "tyler", description: "Brunch" },
    { daysBack: 18, amount: 5500, cat: "Transport", payer: "joint", description: "Gas" },
    { daysBack: 22, amount: 12500, cat: "Shopping", payer: "wife", description: "New running shoes" },
    { daysBack: 25, amount: 3200, cat: "Dining", payer: "tyler", description: "Date night" },
    { daysBack: 28, amount: 2100, cat: "Groceries", payer: "wife", description: "Mid-week grocery" },
    { daysBack: 32, amount: 4500, cat: "Groceries", payer: "tyler", description: "Whole Foods" },
    { daysBack: 35, amount: 8900, cat: "Health", payer: "tyler", description: "Doctor copay" },
    { daysBack: 38, amount: 1750, cat: "Dining", payer: "wife", description: "Lunch out" },
    { daysBack: 42, amount: 3400, cat: "Shopping", payer: "wife", description: "Home goods" },
    { daysBack: 47, amount: 6800, cat: "Groceries", payer: "wife", description: "Costco" },
    { daysBack: 51, amount: 1280, cat: "Transport", payer: "tyler", description: "Parking" },
    { daysBack: 56, amount: 2400, cat: "Dining", payer: "joint", description: "Friends in town" },
    { daysBack: 62, amount: 4900, cat: "Groceries", payer: "tyler", description: "Whole Foods" },
    { daysBack: 68, amount: 2150, cat: "Misc", payer: "wife", description: "Birthday gift" },
    { daysBack: 75, amount: 5500, cat: "Transport", payer: "joint", description: "Gas + carwash" },
    { daysBack: 82, amount: 3200, cat: "Dining", payer: "tyler", description: "Pizza night" },
    { daysBack: 88, amount: 4100, cat: "Groceries", payer: "wife", description: "Local market" },
  ];
  await db.insert(schema.expenses).values(
    sampleExpenses.map((e) => ({
      occurredOn: iso(addDays(today, -e.daysBack)),
      amountCents: e.amount,
      categoryId: catByName.get(e.cat) ?? null,
      payer: e.payer,
      description: e.description,
      notes: "",
    })),
  );

  const accounts = await db
    .insert(schema.investmentAccounts)
    .values([
      { name: "Fidelity 401(k)", kind: "401k", owner: "tyler", archived: false },
      { name: "Vanguard Roth IRA", kind: "roth-ira", owner: "tyler", archived: false },
      { name: "Wife — 401(k)", kind: "401k", owner: "wife", archived: false },
      { name: "Joint brokerage", kind: "brokerage", owner: "joint", archived: false },
      { name: "HSA", kind: "hsa", owner: "tyler", archived: false },
    ])
    .returning();

  const startingBalances: Record<string, number> = {
    "Fidelity 401(k)": 14500000,
    "Vanguard Roth IRA": 4200000,
    "Wife — 401(k)": 9800000,
    "Joint brokerage": 6500000,
    HSA: 850000,
  };
  const balanceRows: Array<{
    accountId: number;
    asOf: string;
    balanceCents: number;
  }> = [];
  for (const account of accounts) {
    let balance = startingBalances[account.name] ?? 100000;
    for (let m = 11; m >= 0; m--) {
      // ~1% growth + small noise per month
      const growth = 1 + 0.008 + (Math.random() - 0.5) * 0.02;
      balance = Math.round(balance * growth);
      balanceRows.push({
        accountId: account.id,
        asOf: iso(subMonths(today, m)),
        balanceCents: balance,
      });
    }
  }
  await db.insert(schema.investmentBalances).values(balanceRows);
}
