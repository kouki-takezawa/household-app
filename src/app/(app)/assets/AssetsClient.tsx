"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { type AssetAccount, type AssetSnapshot, formatYen, todayStr } from "@/lib/types";
import { addAssetSnapshot } from "@/lib/actions";

const TYPE_LABEL: Record<AssetAccount["type"], string> = {
  cash: "現金",
  bank: "銀行預金",
  investment: "投資信託・株式等",
};

const TYPE_COLOR: Record<AssetAccount["type"], string> = {
  cash: "#f59e0b",
  bank: "#3b82f6",
  investment: "#10b981",
};

function latestSnapshot(snapshots: AssetSnapshot[], accountId: string) {
  return snapshots
    .filter((s) => s.assetAccountId === accountId)
    .sort((a, b) => b.date.localeCompare(a.date))[0];
}

function emptyForm(accountId: string, today: string) {
  return { assetAccountId: accountId, date: today, value: "", note: "" };
}

export default function AssetsClient({
  accounts,
  initialSnapshots,
}: {
  accounts: AssetAccount[];
  initialSnapshots: AssetSnapshot[];
}) {
  const today = todayStr();
  const [snapshots, setSnapshots] = useState<AssetSnapshot[]>(initialSnapshots);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => emptyForm(accounts[0]?.id ?? "", today));

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
    return [...map.entries()].map(([type, value]) => ({
      name: TYPE_LABEL[type],
      value,
      color: TYPE_COLOR[type],
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

  function openForm(accountId: string) {
    setForm(emptyForm(accountId, today));
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(form.value);
    if (!value || value < 0) return;
    setSaving(true);
    const newSnapshot: AssetSnapshot = {
      id: `s${Date.now()}`,
      assetAccountId: form.assetAccountId,
      date: form.date,
      value,
      note: form.note || undefined,
    };
    setSnapshots((prev) => [...prev, newSnapshot]);
    await addAssetSnapshot(newSnapshot);
    setSaving(false);
    setShowForm(false);
  }

  return (
    <div className="flex flex-col gap-6 pt-1">
      <section>
        <h2 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide text-slate-400">
          資産総額
        </h2>
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-900/5">
          <p className="text-[26px] font-bold text-emerald-600">{formatYen(total)}</p>
          <p className="mt-1 text-[12px] text-slate-400">最新のスナップショット合計</p>
        </div>
      </section>

      {allocation.length > 0 && (
        <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-900/5">
          <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-slate-400">
            資産配分
          </h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={allocation}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(d: { name?: string }) => d.name ?? ""}
                >
                  {allocation.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatYen(Number(v ?? 0))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-900/5">
        <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-slate-400">
          資産推移
        </h2>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="date" fontSize={12} stroke="#94a3b8" />
              <YAxis fontSize={12} stroke="#94a3b8" tickFormatter={(v) => `${v / 10000}万`} />
              <Tooltip formatter={(v) => formatYen(Number(v ?? 0))} />
              <Legend />
              <Line type="monotone" dataKey="資産合計" stroke="#10b981" strokeWidth={2.5} dot />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section>
        <h2 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide text-slate-400">
          資産口座一覧
        </h2>
        <div className="divide-y divide-slate-100 rounded-2xl bg-white shadow-sm ring-1 ring-slate-900/5">
          {latestByAccount.map(({ account, snapshot }) => (
            <div key={account.id} className="flex items-center gap-3 p-3.5">
              <span
                className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                style={{ backgroundColor: TYPE_COLOR[account.type] }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-medium text-slate-800">{account.name}</p>
                <p className="text-[12px] text-slate-400">
                  {TYPE_LABEL[account.type]}
                  {snapshot ? ` ・ 最終更新 ${snapshot.date}` : " ・ 未記録"}
                </p>
              </div>
              <p className="text-[15px] font-semibold text-slate-900">
                {snapshot ? formatYen(snapshot.value) : "―"}
              </p>
              <button
                type="button"
                onClick={() => openForm(account.id)}
                className="rounded-full px-2.5 py-1.5 text-[12px] font-medium text-emerald-600 active:bg-emerald-50"
              >
                記録
              </button>
            </div>
          ))}
        </div>
      </section>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-sm rounded-t-3xl bg-white px-5 pt-3 shadow-xl sm:rounded-3xl sm:pt-5"
            style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
          >
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-300 sm:hidden" />
            <h3 className="mb-4 text-[17px] font-bold text-slate-900">残高・評価額を記録</h3>
            <div className="flex flex-col gap-3">
              <label className="text-[12px] text-slate-400">
                資産口座
                <select
                  value={form.assetAccountId}
                  onChange={(e) => setForm((f) => ({ ...f, assetAccountId: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[16px] focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-[12px] text-slate-400">
                日付
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[16px] focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </label>
              <label className="text-[12px] text-slate-400">
                残高・評価額
                <input
                  type="number"
                  required
                  min={0}
                  value={form.value}
                  onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[16px] focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  placeholder="0"
                />
              </label>
              <label className="text-[12px] text-slate-400">
                メモ
                <input
                  type="text"
                  value={form.note}
                  onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[16px] focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  placeholder="任意"
                />
              </label>
            </div>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 rounded-full border border-slate-200 py-3 text-[15px] font-semibold text-slate-600 active:bg-slate-50"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-full bg-emerald-600 py-3 text-[15px] font-semibold text-white shadow-sm shadow-emerald-600/30 transition-transform active:scale-[0.98] disabled:opacity-60"
              >
                {saving ? "保存中…" : "保存"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
