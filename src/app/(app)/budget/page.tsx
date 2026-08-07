import { getCategories, getTransactions } from "@/lib/gas";
import BudgetClient from "./BudgetClient";

export default async function BudgetPage() {
  const [categories, transactions] = await Promise.all([
    getCategories(),
    getTransactions(),
  ]);

  return <BudgetClient categories={categories} initialTransactions={transactions} />;
}
