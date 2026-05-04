# Mile-High Money

A two-person personal finance dashboard. Tracks monthly **income**, **bills**,
**expenses** (with categories and budgets), and **investment** balances over time.

Built with **Next.js 16 (App Router) + TypeScript**, **Drizzle ORM** on **Neon
Postgres**, **shadcn/ui + Tailwind v4**, and **Recharts**. All money is stored
as integer cents.

## Setup

### 1. Install deps and the Vercel CLI

```bash
npm install
npm i -g vercel
vercel login
```

### 2. Provision Neon Postgres via the Vercel Marketplace

```bash
vercel link            # link this directory to a Vercel project
# Then: open the Vercel dashboard → Storage → Marketplace → Neon Postgres → Add
# Or use the integration flow from the Vercel CLI / dashboard.
vercel env pull .env.local
```

`.env.local` should now contain `DATABASE_URL=postgres://…` pointing at the
Neon database. (Drizzle uses the HTTP driver via `@neondatabase/serverless`, so
no pooler config is needed.)

### 3. Push the schema

```bash
npx drizzle-kit push
```

### 4. Run locally

```bash
npm run dev
# http://localhost:3000
```

Suggested first-run flow:
1. **Categories** — add `Groceries`, `Dining`, `Utilities`, `Transport`,
   `Subscriptions`, etc., each with a monthly budget.
2. **Income** — add recurring income sources (your salary, your wife's salary,
   side income). Set `startMonth` to when each began.
3. **Bills** — add recurring bills with their due day.
4. **Investments** — add accounts (401k, IRAs, brokerage, etc.) and log a
   starting balance.
5. **Expenses** — log expenses as they happen.

## Deploy

```bash
vercel deploy           # preview
vercel deploy --prod    # production
```

### Make it private to just the two of you

The app has no built-in auth. Use **Vercel Deployment Protection** to gate access:

1. Vercel dashboard → your project → **Settings → Deployment Protection**.
2. Enable either **Vercel Authentication** (free, requires both of you to sign
   in with a Vercel account; add your wife's email under
   **Project → Members** if needed) or **Password Protection** (Pro plan,
   shared password).
3. Apply protection to **Production** and **Preview** deployments.

## Data model

All amounts are integer **cents** (`bigint`). Dates are `DATE` (no time zones).

| Table | Purpose |
| --- | --- |
| `categories` | Spending buckets; each has a `monthly_budget_cents`. |
| `income_sources` | Recurring income with `start_month`/`end_month` window. |
| `bills` | Recurring bills with `due_day`. |
| `bill_payments` | One row per `(bill_id, year_month)` when a bill is paid. |
| `expenses` | One-off expenses with optional `category_id` + `payer`. |
| `investment_accounts` | Investment containers (401k, IRA, brokerage, …). |
| `investment_balances` | Periodic balance snapshots; `(account_id, as_of)` is unique. |

## Project layout

```
app/
  layout.tsx                  root layout + Toaster
  globals.css                 shadcn neutral theme tokens
  (dashboard)/
    layout.tsx                sidebar + month picker shell
    page.tsx                  overview
    categories/               CRUD + budgets
    expenses/                 quick-add table
    income/                   recurring sources
    bills/                    list + mark-paid toggle
    investments/              accounts + balance log + trend
    reports/                  12-month trends
components/
  ui/                         shadcn-generated primitives
  forms/                      one form-dialog per entity
  charts/                     Recharts wrappers
  sidebar-nav.tsx, month-picker.tsx
lib/
  db/                         drizzle client + schema
  queries.ts                  read helpers
  reports.ts                  monthly aggregate queries
  money.ts                    cents ↔ dollars
  dates.ts                    YearMonth helpers
drizzle.config.ts
```

## Scripts

```bash
npm run dev      # next dev (Turbopack)
npm run build    # production build
npm run start    # serve build
npm run lint     # eslint
npx drizzle-kit push       # apply schema directly
npx drizzle-kit generate   # produce migration SQL
npx drizzle-kit studio     # browse the DB
```
