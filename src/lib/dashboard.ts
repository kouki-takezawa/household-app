import type { AssetAccount, AssetSnapshot, ScheduleEvent, Transaction } from "./types";

export function monthlySummary(transactions: Transaction[], currentMonth: string) {
  const thisMonth = transactions.filter((t) => t.date.startsWith(currentMonth));
  const income = thisMonth
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const expense = thisMonth
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  return { income, expense, balance: income - expense };
}

export function upcomingEvents(events: ScheduleEvent[], today: string, limit = 4) {
  return [...events]
    .filter((e) => e.endDate >= today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .slice(0, limit);
}

export function totalAssetsAsOf(
  accounts: AssetAccount[],
  snapshots: AssetSnapshot[],
  asOfDate: string
) {
  let total = 0;
  for (const account of accounts) {
    const snapshotsForAccount = snapshots
      .filter((s) => s.assetAccountId === account.id && s.date <= asOfDate)
      .sort((a, b) => b.date.localeCompare(a.date));
    if (snapshotsForAccount[0]) total += snapshotsForAccount[0].value;
  }
  return total;
}

/** "2026-08" のような年月文字列を delta ヶ月分ずらす */
export function shiftMonthStr(monthStr: string, delta: number): string {
  const [y, m] = monthStr.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
