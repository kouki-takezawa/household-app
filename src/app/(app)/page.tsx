import Link from "next/link";
import { ColorAvatar } from "@/components/ColorAvatar";
import { EmptyState } from "@/components/EmptyState";
import { GlobalSearch } from "@/components/GlobalSearch";
import { Sparkline } from "@/components/Sparkline";
import {
  getTransactions,
  getEvents,
  getAssetAccounts,
  getAssetSnapshots,
  getCategories,
  getMembers,
} from "@/lib/gas";
import { findCategoryById, findMemberById, formatYen, formatEventSchedule, todayStr } from "@/lib/types";
import {
  monthlySummary,
  recentTransactions,
  upcomingEvents,
  totalAssetsAsOf,
  assetsTrend,
  shiftMonthStr,
} from "@/lib/dashboard";

export default async function HomePage() {
  const [transactions, events, accounts, snapshots, categories, members] = await Promise.all([
    getTransactions(),
    getEvents(),
    getAssetAccounts(),
    getAssetSnapshots(),
    getCategories(),
    getMembers(),
  ]);

  const today = todayStr();
  const currentMonth = today.slice(0, 7);
  const previousMonth = shiftMonthStr(currentMonth, -1);

  const { income, expense, balance } = monthlySummary(transactions, currentMonth);
  const upcoming = upcomingEvents(events, today);
  const recent = recentTransactions(transactions, 3);
  const assetsTotal = totalAssetsAsOf(accounts, snapshots, today);
  const assetsTotalPrevMonth = totalAssetsAsOf(accounts, snapshots, `${previousMonth}-31`);
  const assetsDelta =
    assetsTotalPrevMonth > 0
      ? ((assetsTotal - assetsTotalPrevMonth) / assetsTotalPrevMonth) * 100
      : null;
  const trend = assetsTrend(accounts, snapshots, currentMonth, 6);

  return (
    <div className="flex flex-col gap-7">
      <GlobalSearch />

      <section>
        <p className="px-1 text-[13px] font-medium text-muted">資産総額</p>
        <div className="mt-2 rounded-[28px] bg-surface p-6 shadow-card-lg ring-1 ring-line-soft">
          <p className="text-[44px] font-bold leading-none tracking-tight tabular-nums text-foreground">
            {formatYen(assetsTotal)}
          </p>
          {assetsDelta !== null && (
            <p
              className={`mt-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[13px] font-semibold ${
                assetsDelta >= 0
                  ? "bg-brand/10 text-brand"
                  : "bg-rose-500/10 text-rose-500"
              }`}
            >
              <span>{assetsDelta >= 0 ? "▲" : "▼"}</span>
              {Math.abs(assetsDelta).toFixed(1)}%
              <span className="font-normal text-muted">先月比</span>
            </p>
          )}
          {trend.some((v) => v > 0) && (
            <div className="mt-4 -mb-1">
              <Sparkline values={trend} />
            </div>
          )}
          <Link
            href="/assets"
            className="mt-2 inline-block text-[13px] font-medium text-brand"
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
          <div className="rounded-2xl bg-surface p-3.5 shadow-card ring-1 ring-line-soft">
            <div className="flex items-center gap-1.5 text-[11px] text-muted">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3">
                  <path d="M8 12.5V3.5M4 7.5 8 3.5l4 4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              収入
            </div>
            <p className="mt-1.5 text-[19px] font-bold tabular-nums text-emerald-600">
              {formatYen(income)}
            </p>
          </div>
          <div className="rounded-2xl bg-surface p-3.5 shadow-card ring-1 ring-line-soft">
            <div className="flex items-center gap-1.5 text-[11px] text-muted">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500/10 text-rose-500">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3">
                  <path d="M8 3.5v9M4 8.5 8 12.5l4-4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              支出
            </div>
            <p className="mt-1.5 text-[19px] font-bold tabular-nums text-rose-500">
              {formatYen(expense)}
            </p>
          </div>
          <div className="rounded-2xl bg-surface p-3.5 shadow-card ring-1 ring-line-soft">
            <div className="flex items-center gap-1.5 text-[11px] text-muted">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand/10 text-brand">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3">
                  <path d="M3 8.5h10M9.5 4.5 13 8.5l-3.5 4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              差引
            </div>
            <p className="mt-1.5 text-[19px] font-bold tabular-nums text-foreground">
              {formatYen(balance)}
            </p>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between px-1">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted">
            最近の家計簿記録
          </h2>
          <Link href="/budget" className="text-[13px] font-medium text-brand">
            すべて見る →
          </Link>
        </div>
        <div className="divide-y divide-line-soft rounded-2xl bg-surface shadow-card ring-1 ring-line-soft">
          {recent.length === 0 && (
            <EmptyState
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                  <rect x="3.5" y="6" width="17" height="12" rx="2.5" />
                  <path d="M3.5 10h17" />
                </svg>
              }
              message="まだ記録がありません"
            />
          )}
          {recent.map((t) => {
            const category = findCategoryById(categories, t.categoryId);
            return (
              <Link key={t.id} href="/budget" className="flex items-center gap-3 p-3.5 active:bg-track">
                <ColorAvatar label={category?.name ?? "?"} color={category?.color} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium text-foreground">
                    {category?.name ?? "その他"}
                    {t.memo ? ` ・ ${t.memo}` : ""}
                  </p>
                  <p className="text-[12px] text-muted">{t.date}</p>
                </div>
                <p
                  className={`text-[14px] font-semibold tabular-nums ${
                    t.type === "income" ? "text-emerald-600" : "text-rose-500"
                  }`}
                >
                  {t.type === "income" ? "+" : "-"}
                  {formatYen(t.amount)}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide text-muted">
          近い予定
        </h2>
        <div className="divide-y divide-line-soft rounded-2xl bg-surface shadow-card ring-1 ring-line-soft">
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
                <ColorAvatar label={member?.name ?? "?"} color={member?.color} />
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
