"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  type AssetAccount,
  type AssetSnapshot,
  ASSET_TYPE_LABEL as TYPE_LABEL,
  ASSET_TYPE_COLOR as TYPE_COLOR,
  formatYen,
} from "@/lib/types";
import { ColorAvatar } from "@/components/ColorAvatar";
import { EmptyState } from "@/components/EmptyState";
import { chartTooltipStyle } from "@/lib/chartTheme";

function latestSnapshot(snapshots: AssetSnapshot[], accountId: string) {
  return snapshots
    .filter((s) => s.assetAccountId === accountId)
    .sort((a, b) => b.date.localeCompare(a.date))[0];
}

export default function AssetsClient({
  accounts,
  initialSnapshots,
}: {
  accounts: AssetAccount[];
  initialSnapshots: AssetSnapshot[];
}) {
  const router = useRouter();
  const snapshots = initialSnapshots;

  const accountById = useMemo(() => {
    const map = new Map<string, AssetAccount>();
    for (const a of accounts) map.set(a.id, a);
    return map;
  }, [accounts]);

  const latestByAccount = useMemo(
    () =>
      accounts.map((account) => ({
        account,
        snapshot: latestSnapshot(snapshots, account.id),
      })),
    [accounts, snapshots]
  );

  const total = latestByAccount.reduce((sum, a) => sum + (a.snapshot?.value ?? 0), 0);

  const allocation = useMemo(() => {
    const map = new Map<AssetAccount["type"], number>();
    for (const { account, snapshot } of latestByAccount) {
      if (!snapshot) continue;
      map.set(account.type, (map.get(account.type) ?? 0) + snapshot.value);
    }
    const allocTotal = [...map.values()].reduce((s, v) => s + v, 0);
    return [...map.entries()].map(([type, value]) => ({
      name: TYPE_LABEL[type],
      value,
      color: TYPE_COLOR[type],
      percent: allocTotal > 0 ? (value / allocTotal) * 100 : 0,
    }));
  }, [latestByAccount]);

  const trend = useMemo(() => {
    const dateSet = new Set(snapshots.map((s) => s.date));
    const dates = [...dateSet].sort();
    return dates.map((date) => {
      let sum = 0;
      for (const account of accounts) {
        const upToDate = snapshots
          .filter((s) => s.assetAccountId === account.id && s.date <= date)
          .sort((a, b) => b.date.localeCompare(a.date))[0];
        if (upToDate) sum += upToDate.value;
      }
      return { date: date.slice(5), 資産合計: sum };
    });
  }, [snapshots, accounts]);

  const history = useMemo(
    () => [...snapshots].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8),
    [snapshots]
  );

  return (
    <div className="flex flex-col gap-6">
      <section>
        <div className="mb-2 flex items-center justify-between px-1">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted">
            資産総額
          </h2>
          <Link href="/settings?tab=assets" className="btn-add">
            ＋ 口座を追加
          </Link>
        </div>
        <div className="rounded-2xl bg-surface p-4 shadow-card ring-1 ring-line-soft">
          <p className="text-[26px] font-bold tabular-nums text-brand">{formatYen(total)}</p>
          <p className="mt-1 text-[12px] text-muted">最新のスナップショット合計</p>
        </div>
      </section>

      {allocation.length > 0 && (
        <section className="rounded-2xl bg-surface p-4 shadow-card ring-1 ring-line-soft">
          <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-muted">
            資産配分
          </h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={allocation} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                  {allocation.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatYen(Number(v ?? 0))} {...chartTooltipStyle()} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex flex-col gap-2.5">
            {allocation.map((a) => (
              <div key={a.name} className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: a.color }} />
                <p className="w-28 flex-shrink-0 truncate text-[12px] text-foreground" title={a.name}>
                  {a.name}
                </p>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-track">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${a.percent}%`, backgroundColor: a.color }}
                  />
                </div>
                <p className="w-11 flex-shrink-0 text-right text-[12px] tabular-nums text-muted">
                  {a.percent.toFixed(0)}%
                </p>
                <p className="w-24 flex-shrink-0 text-right text-[12px] font-semibold tabular-nums text-foreground">
                  {formatYen(a.value)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-2xl bg-surface p-4 shadow-card ring-1 ring-line-soft">
        <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-muted">
          資産推移
        </h2>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="assetsTotalGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
              <XAxis dataKey="date" fontSize={12} stroke="var(--muted)" />
              <YAxis fontSize={12} stroke="var(--muted)" tickFormatter={(v) => `${v / 10000}万`} />
              <Tooltip formatter={(v) => formatYen(Number(v ?? 0))} {...chartTooltipStyle()} />
              <Area
                type="monotone"
                dataKey="資産合計"
                stroke="var(--brand)"
                strokeWidth={2.5}
                fill="url(#assetsTotalGradient)"
                dot={{ r: 3 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section>
        <h2 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide text-muted">
          資産口座一覧
        </h2>
        <div className="divide-y divide-line-soft rounded-2xl bg-surface shadow-card ring-1 ring-line-soft">
          {latestByAccount.length === 0 && (
            <EmptyState
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                  <path d="M4 19V10M10 19V5M16 19v-7M21 19H3" />
                </svg>
              }
              message="まだ口座が登録されていません"
              actionLabel="口座を追加"
              onAction={() => router.push("/settings?tab=assets")}
            />
          )}
          {latestByAccount.map(({ account, snapshot }) => (
            <Link
              key={account.id}
              href={`/assets/${account.id}`}
              className="flex items-center gap-3 p-3.5 active:bg-track"
            >
              <ColorAvatar label={account.name} color={TYPE_COLOR[account.type]} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-medium text-foreground">{account.name}</p>
                <p className="text-[12px] text-muted">
                  {TYPE_LABEL[account.type]}
                  {snapshot ? ` ・ 最終更新 ${snapshot.date}` : " ・ 未記録"}
                </p>
              </div>
              <p className="text-[15px] font-semibold tabular-nums text-foreground">
                {snapshot ? formatYen(snapshot.value) : "―"}
              </p>
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 flex-shrink-0 text-muted">
                <path d="m8 5 5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide text-muted">
          最近の記録
        </h2>
        <div className="divide-y divide-line-soft rounded-2xl bg-surface shadow-card ring-1 ring-line-soft">
          {history.length === 0 && (
            <EmptyState
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                  <path d="M4 19V10M10 19V5M16 19v-7M21 19H3" />
                </svg>
              }
              message="記録はまだありません"
              actionLabel={accounts.length > 0 ? "残高を記録" : "口座を追加"}
              onAction={() =>
                router.push(accounts.length > 0 ? `/assets/${accounts[0].id}` : "/settings?tab=assets")
              }
            />
          )}
          {history.map((s) => {
            const account = accountById.get(s.assetAccountId);
            return (
              <Link
                key={s.id}
                href={`/assets/${s.assetAccountId}`}
                className="flex items-center gap-3 p-3.5 active:bg-track"
              >
                <ColorAvatar
                  label={account?.name ?? "?"}
                  color={account ? TYPE_COLOR[account.type] : undefined}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium text-foreground">
                    {account?.name ?? "不明な口座"}
                    {s.note ? ` ・ ${s.note}` : ""}
                  </p>
                  <p className="text-[12px] text-muted">{s.date}</p>
                </div>
                <p className="text-[15px] font-semibold tabular-nums text-foreground">{formatYen(s.value)}</p>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
