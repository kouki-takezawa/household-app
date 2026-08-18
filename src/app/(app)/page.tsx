import Link from "next/link";
import { format, parseISO } from "date-fns";
import { ja } from "date-fns/locale";
import PageHeader from "@/components/PageHeader";
import {
  getTransactions,
  getEvents,
  getAssetAccounts,
  getAssetSnapshots,
  getMembers,
} from "@/lib/gas";
import {
  findMemberById,
  formatYen,
  formatEventSchedule,
  todayStr,
  type ScheduleEvent,
} from "@/lib/types";

function monthlySummary(
  transactions: Awaited<ReturnType<typeof getTransactions>>,
  currentMonth: string
) {
  const thisMonth = transactions.filter((t) => t.date.startsWith(currentMonth));
  const income = thisMonth
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const expense = thisMonth
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  return { income, expense, balance: income - expense };
}

function upcomingEvents(events: ScheduleEvent[], today: string, limit = 4) {
  return [...events]
    .filter((e) => e.endDate >= today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .slice(0, limit);
}

function totalAssets(
  accounts: Awaited<ReturnType<typeof getAssetAccounts>>,
  snapshots: Awaited<ReturnType<typeof getAssetSnapshots>>
) {
  let total = 0;
  for (const account of accounts) {
    const snapshotsForAccount = snapshots
      .filter((s) => s.assetAccountId === account.id)
      .sort((a, b) => b.date.localeCompare(a.date));
    if (snapshotsForAccount[0]) total += snapshotsForAccount[0].value;
  }
  return total;
}

export default async function HomePage() {
  const [transactions, events, accounts, snapshots, members] = await Promise.all([
    getTransactions(),
    getEvents(),
    getAssetAccounts(),
    getAssetSnapshots(),
    getMembers(),
  ]);

  const today = todayStr();
  const currentMonth = today.slice(0, 7);

  const { income, expense, balance } = monthlySummary(transactions, currentMonth);
  const upcoming = upcomingEvents(events, today);
  const assetsTotal = totalAssets(accounts, snapshots);

  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        title="ホーム"
        subtitle={format(parseISO(today), "M月d日(E)", { locale: ja })}
      />

      <section>
        <h2 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide text-slate-400">
          今月の収支（{currentMonth}）
        </h2>
        <div className="grid grid-cols-3 gap-2.5">
          <div className="rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-slate-900/5">
            <p className="text-[11px] text-slate-400">収入</p>
            <p className="mt-1 text-[17px] font-bold text-emerald-600">
              {formatYen(income)}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-slate-900/5">
            <p className="text-[11px] text-slate-400">支出</p>
            <p className="mt-1 text-[17px] font-bold text-rose-500">
              {formatYen(expense)}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-slate-900/5">
            <p className="text-[11px] text-slate-400">差引</p>
            <p className="mt-1 text-[17px] font-bold text-slate-900">
              {formatYen(balance)}
            </p>
          </div>
        </div>
        <Link
          href="/budget"
          className="mt-2.5 inline-block px-1 text-[13px] font-medium text-amber-700"
        >
          家計簿を見る →
        </Link>
      </section>

      <section>
        <h2 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide text-slate-400">
          資産総額
        </h2>
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-900/5">
          <p className="text-[26px] font-bold text-amber-700">
            {formatYen(assetsTotal)}
          </p>
          <p className="mt-1 text-[12px] text-slate-400">最新のスナップショット合計</p>
        </div>
        <Link
          href="/assets"
          className="mt-2.5 inline-block px-1 text-[13px] font-medium text-amber-700"
        >
          資産管理を見る →
        </Link>
      </section>

      <section>
        <h2 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide text-slate-400">
          近い予定
        </h2>
        <div className="divide-y divide-slate-100 rounded-2xl bg-white shadow-sm ring-1 ring-slate-900/5">
          {upcoming.length === 0 && (
            <p className="p-4 text-[13px] text-slate-400">予定はありません</p>
          )}
          {upcoming.map((event) => {
            const member = findMemberById(members, event.memberId);
            return (
              <div key={event.id} className="flex items-center gap-3 p-3.5">
                <span
                  className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: member?.color }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium text-slate-800">
                    {event.title}
                  </p>
                  <p className="text-[12px] text-slate-400">
                    {formatEventSchedule(event)} ・ {member?.name}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        <Link
          href="/schedule"
          className="mt-2.5 inline-block px-1 text-[13px] font-medium text-amber-700"
        >
          日程表を見る →
        </Link>
      </section>
    </div>
  );
}
