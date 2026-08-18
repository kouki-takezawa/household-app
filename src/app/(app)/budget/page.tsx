import { getCategories, getMembers, getTransactions } from "@/lib/gas";
import BudgetClient from "./BudgetClient";

export default async function BudgetPage() {
  const [categories, members, transactions] = await Promise.all([
    getCategories(),
    getMembers(),
    getTransactions(),
  ]);

  return (
    <BudgetClient
      categories={categories}
      members={members}
      initialTransactions={transactions}
    />
  );
}
