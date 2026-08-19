import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
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

function totalAssetsAsOf(
  accounts: Awaited<ReturnType<typeof getAssetAccounts>>,
  snapshots: Awaited<ReturnType<typeof getAssetSnapshots>>,
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
function shiftMonthStr(monthStr: string, delta: number): string {
  const [y, m] = monthStr.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
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
  const previousMonth = shiftMonthStr(currentMonth, -1);

  const { income, expense, balance } = monthlySummary(transactions, currentMonth);
  const upcoming = upcomingEvents(events, today);
  const assetsTotal = totalAssetsAsOf(accounts, snapshots, today);
  const assetsTotalPrevMonth = totalAssetsAsOf(accounts, snapshots, `${previousMonth}-31`);
  const assetsDelta =
    assetsTotalPrevMonth > 0
      ? ((assetsTotal - assetsTotalPrevMonth) / assetsTotalPrevMonth) * 100
      : null;

  return (
    <div className="flex flex-col gap-7">
      <section>
        <p className="px-1 text-[13px] font-medium text-muted">資産総額</p>
        <div className="mt-2 rounded-[28px] bg-surface p-6 shadow-[0_4px_28px_-6px_rgba(120,90,40,0.18)] ring-1 ring-line-soft">
          <p className="text-[40px] font-bold leading-none tracking-tight text-foreground">
            {formatYen(assetsTotal)}
          </p>
          {assetsDelta !== null && (
            <p
              className={`mt-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[13px] font-semibold ${
                assetsDelta >= 0
                  ? "bg-emerald-600/10 text-emerald-600"
                  : "bg-rose-500/10 text-rose-500"
              }`}
            >
              <span>{assetsDelta >= 0 ? "▲" : "▼"}</span>
              {Math.abs(assetsDelta).toFixed(1)}%
              <span className="font-normal text-muted">先月比</span>
            </p>
          )}
          <Link
            href="/assets"
            className="mt-4 inline-block text-[13px] font-medium text-brand"
          >
            資産管理を見る →
          </Link>
        </div>
      </section>

      <section>
        <h2 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide text-muted">
          今月の収支（{currentMonth}）
        </h2>
        <div className="grid grid-cols-3 gap-2.5">
          <div className="rounded-2xl bg-surface p-3.5 shadow-[0_2px_20px_-6px_rgba(120,90,40,0.14)] ring-1 ring-line-soft">
            <p className="text-[11px] text-muted">収入</p>
            <p className="mt-1 text-[17px] font-bold text-emerald-600">
              {formatYen(income)}
            </p>
          </div>
          <div className="rounded-2xl bg-surface p-3.5 shadow-[0_2px_20px_-6px_rgba(120,90,40,0.14)] ring-1 ring-line-soft">
            <p className="text-[11px] text-muted">支出</p>
            <p className="mt-1 text-[17px] font-bold text-rose-500">
              {formatYen(expense)}
            </p>
          </div>
          <div className="rounded-2xl bg-surface p-3.5 shadow-[0_2px_20px_-6px_rgba(120,90,40,0.14)] ring-1 ring-line-soft">
            <p className="text-[11px] text-muted">差引</p>
            <p className="mt-1 text-[17px] font-bold text-foreground">
              {formatYen(balance)}
            </p>
          </div>
        </div>
        <Link
          href="/budget"
          className="mt-2.5 inline-block px-1 text-[13px] font-medium text-brand"
        >
          家計簿を見る →
        </Link>
      </section>

      <section>
        <h2 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide text-muted">
          近い予定
        </h2>
        <div className="divide-y divide-line-soft rounded-2xl bg-surface shadow-[0_2px_20px_-6px_rgba(120,90,40,0.14)] ring-1 ring-line-soft">
          {upcoming.length === 0 && (
            <EmptyState
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                  <rect x="3.5" y="5.5" width="17" height="15" rx="2.5" />
                  <path d="M3.5 9.5h17M8 3v4M16 3v4" />
                </svg>
              }
              message="直近の予定はありません"
            />
          )}
          {upcoming.map((event) => {
            const member = findMemberById(members, event.memberId);
            return (
              <Link
                key={event.id}
                href={`/schedule/${event.id}`}
                className="flex items-center gap-3 p-3.5 active:bg-track"
              >
                <span
                  className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: member?.color }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium text-foreground">
                    {event.title}
                  </p>
                  <p className="text-[12px] text-muted">
                    {formatEventSchedule(event)} ・ {member?.name}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
        <Link
          href="/schedule"
          className="mt-2.5 inline-block px-1 text-[13px] font-medium text-brand"
        >
          日程表を見る →
        </Link>
      </section>
    </div>
  );
}
