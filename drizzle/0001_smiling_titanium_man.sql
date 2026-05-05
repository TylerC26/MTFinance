CREATE TABLE "cash_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"owner" text NOT NULL,
	"opening_balance_cents" bigint DEFAULT 0 NOT NULL,
	"opening_as_of" date NOT NULL,
	"archived" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transfers" (
	"id" serial PRIMARY KEY NOT NULL,
	"from_account_id" integer NOT NULL,
	"to_account_id" integer NOT NULL,
	"amount_cents" bigint NOT NULL,
	"occurred_on" date NOT NULL,
	"notes" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bill_payments" ADD COLUMN "account_id" integer;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "account_id" integer;--> statement-breakpoint
ALTER TABLE "income_sources" ADD COLUMN "account_id" integer;--> statement-breakpoint
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_from_account_id_cash_accounts_id_fk" FOREIGN KEY ("from_account_id") REFERENCES "public"."cash_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_to_account_id_cash_accounts_id_fk" FOREIGN KEY ("to_account_id") REFERENCES "public"."cash_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bill_payments" ADD CONSTRAINT "bill_payments_account_id_cash_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."cash_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_account_id_cash_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."cash_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "income_sources" ADD CONSTRAINT "income_sources_account_id_cash_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."cash_accounts"("id") ON DELETE set null ON UPDATE no action;