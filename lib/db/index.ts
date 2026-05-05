import { isNull, sql } from "drizzle-orm";
import * as schema from "./schema";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

const MOCK = process.env.MOCK_MODE === "1";

type DB = NodePgDatabase<typeof schema>;

async function ensureCashAccounts(db: DB) {
  const [first] = await db.select().from(schema.cashAccounts).limit(1);
  if (first) return;
  const today = new Date().toISOString().slice(0, 10);
  const inserted = await db
    .insert(schema.cashAccounts)
    .values([
      { name: "Tyler", owner: "tyler", openingBalanceCents: 0, openingAsOf: today },
      { name: "Michelle", owner: "wife", openingBalanceCents: 0, openingAsOf: today },
      { name: "Joint", owner: "joint", openingBalanceCents: 0, openingAsOf: today },
    ])
    .returning();
  const byOwner = new Map(inserted.map((a) => [a.owner, a.id]));

  for (const [owner, id] of byOwner) {
    await db
      .update(schema.expenses)
      .set({ accountId: id })
      .where(sql`${schema.expenses.accountId} is null and ${schema.expenses.payer} = ${owner}`);
    await db
      .update(schema.incomeSources)
      .set({ accountId: id })
      .where(sql`${schema.incomeSources.accountId} is null and ${schema.incomeSources.payer} = ${owner}`);
  }
  const jointId = byOwner.get("joint");
  if (jointId != null) {
    await db
      .update(schema.billPayments)
      .set({ accountId: jointId })
      .where(isNull(schema.billPayments.accountId));
  }
}

async function initDb(): Promise<DB> {
  if (MOCK) {
    const [{ PGlite }, { drizzle }] = await Promise.all([
      import("@electric-sql/pglite"),
      import("drizzle-orm/pglite"),
    ]);
    const client = new PGlite();
    await client.exec(SCHEMA_SQL);
    const db = drizzle(client, { schema, casing: "snake_case" });
    const [first] = await db.select().from(schema.categories).limit(1);
    if (!first) {
      const seed = await import("./seed");
      await seed.runSeed(db as unknown as DB);
    }
    await ensureCashAccounts(db as unknown as DB);
    return db as unknown as DB;
  }
  const [{ Pool }, { drizzle }] = await Promise.all([
    import("pg"),
    import("drizzle-orm/node-postgres"),
  ]);
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is not set. Add your Supabase connection string to .env.local.",
    );
  }
  const sslDisabled = /[?&]sslmode=disable\b/.test(databaseUrl);
  // Strip sslmode= so pg-connection-string doesn't override our explicit ssl
  // config — Supabase's pooler chain fails Node's default verification.
  const cleanedUrl = (() => {
    const u = new URL(databaseUrl);
    u.searchParams.delete("sslmode");
    return u.toString();
  })();
  const pool = new Pool({
    connectionString: cleanedUrl,
    ssl: sslDisabled ? false : { rejectUnauthorized: false },
  });
  const db = drizzle(pool, { schema, casing: "snake_case" });
  await ensureCashAccounts(db);
  return db;
}

const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS categories (
    id serial PRIMARY KEY,
    name text NOT NULL UNIQUE,
    color text NOT NULL DEFAULT '#64748b',
    monthly_budget_cents bigint NOT NULL DEFAULT 0,
    archived boolean NOT NULL DEFAULT false
  );
  CREATE TABLE IF NOT EXISTS cash_accounts (
    id serial PRIMARY KEY,
    name text NOT NULL,
    owner text NOT NULL,
    opening_balance_cents bigint NOT NULL DEFAULT 0,
    opening_as_of date NOT NULL,
    archived boolean NOT NULL DEFAULT false
  );
  CREATE TABLE IF NOT EXISTS transfers (
    id serial PRIMARY KEY,
    from_account_id integer NOT NULL REFERENCES cash_accounts(id) ON DELETE CASCADE,
    to_account_id integer NOT NULL REFERENCES cash_accounts(id) ON DELETE CASCADE,
    amount_cents bigint NOT NULL,
    occurred_on date NOT NULL,
    notes text NOT NULL DEFAULT ''
  );
  CREATE TABLE IF NOT EXISTS income_sources (
    id serial PRIMARY KEY,
    name text NOT NULL,
    amount_cents bigint NOT NULL,
    payer text NOT NULL DEFAULT 'joint',
    account_id integer REFERENCES cash_accounts(id) ON DELETE SET NULL,
    start_month date NOT NULL,
    end_month date,
    notes text NOT NULL DEFAULT ''
  );
  CREATE TABLE IF NOT EXISTS bills (
    id serial PRIMARY KEY,
    name text NOT NULL,
    amount_cents bigint NOT NULL,
    due_day smallint NOT NULL,
    category_id integer REFERENCES categories(id) ON DELETE SET NULL,
    autopay boolean NOT NULL DEFAULT false,
    active boolean NOT NULL DEFAULT true,
    notes text NOT NULL DEFAULT ''
  );
  CREATE TABLE IF NOT EXISTS bill_payments (
    id serial PRIMARY KEY,
    bill_id integer NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    year_month text NOT NULL,
    paid_on date NOT NULL,
    amount_cents bigint NOT NULL,
    account_id integer REFERENCES cash_accounts(id) ON DELETE SET NULL
  );
  CREATE UNIQUE INDEX IF NOT EXISTS bill_payments_bill_month_idx
    ON bill_payments (bill_id, year_month);
  CREATE TABLE IF NOT EXISTS expenses (
    id serial PRIMARY KEY,
    occurred_on date NOT NULL,
    amount_cents bigint NOT NULL,
    category_id integer REFERENCES categories(id) ON DELETE SET NULL,
    account_id integer REFERENCES cash_accounts(id) ON DELETE SET NULL,
    payer text,
    description text NOT NULL DEFAULT '',
    notes text NOT NULL DEFAULT ''
  );
  CREATE TABLE IF NOT EXISTS investment_accounts (
    id serial PRIMARY KEY,
    name text NOT NULL,
    kind text NOT NULL DEFAULT 'brokerage',
    owner text NOT NULL DEFAULT 'joint',
    archived boolean NOT NULL DEFAULT false
  );
  CREATE TABLE IF NOT EXISTS investment_balances (
    id serial PRIMARY KEY,
    account_id integer NOT NULL REFERENCES investment_accounts(id) ON DELETE CASCADE,
    as_of date NOT NULL,
    balance_cents bigint NOT NULL
  );
  CREATE UNIQUE INDEX IF NOT EXISTS investment_balances_account_date_idx
    ON investment_balances (account_id, as_of);
`;

const IS_BUILD =
  process.env.NEXT_PHASE === "phase-production-build" ||
  process.env.NEXT_PHASE === "phase-export";

export const db: DB = IS_BUILD
  ? (null as unknown as DB)
  : await initDb();
export { schema };
