import { listCashAccounts, listCategories } from "@/lib/queries";
import { MobileDockClient } from "./mobile-dock-client";

export async function MobileDock() {
  const [cats, cashAccounts] = await Promise.all([
    listCategories(),
    listCashAccounts(),
  ]);
  const expenseCategories = cats
    .filter((c) => !c.archived)
    .map((c) => ({ id: c.id, name: c.name }));
  const accounts = cashAccounts.map((a) => ({
    id: a.id,
    name: a.name,
    owner: a.owner,
  }));
  return <MobileDockClient categories={expenseCategories} accounts={accounts} />;
}
