import { listCategories } from "@/lib/queries";
import { MobileDockClient } from "./mobile-dock-client";

export async function MobileDock() {
  const cats = await listCategories();
  const expenseCategories = cats
    .filter((c) => !c.archived)
    .map((c) => ({ id: c.id, name: c.name }));
  return <MobileDockClient categories={expenseCategories} />;
}
