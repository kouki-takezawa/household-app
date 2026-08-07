"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  type Category,
  type Transaction,
  findCategoryById,
  formatYen,
  todayStr,
} from "@/lib/types";
import { addTransaction, editTransaction, removeTransaction } from "@/lib/actions";

function monthOptions(txs: Transaction[], defaultMonth: string): string[] {
  const set = new Set(txs.map((t) => t.date.slice(0, 7)));
  set.add(defaultMonth);
  return [...set].sort().reverse();
}

function emptyForm(categories: Category[], today: string) {
  return {
    date: today,
    type: "expense" as "income" | "expense",
    categoryId: categories.find((c) => c.type === "expense")?.id ?? "",
    amount: "",
    memo: "",
  };
}

export default function BudgetClient({
  categories,
  initialTransactions,
}: {
  categories: Category[];
  initialTransactions: Transaction[];
}) {
  const today = todayStr();
  const defaultMonth = today.slice(0, 7);

  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [month, setMonth] = useState(defaultMonth);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => emptyForm(categories, today));

  const months = useMemo(() => monthOptions(transactions, defaultMonth), [transactions, defaultMonth]);

  const monthTx = useMemo(
    () =>
      transactions
        .filter((t) => t.date.startsWith(month))
        .sort((a, b) => b.date.localeCompare(a.date)),
    [transactions, month]
  );

  const income = monthTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of monthTx) {
      if (t.type !== "expense") continue;
      map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + t.amount);
    }
    return [...map.entries()].map(([categoryId, value]) => ({
      name: findCategoryById(categories, categoryId)?.name ?? "その他",
      value,
      color: findCategoryById(categories, categoryId)?.color ?? "#94a3b8",
    }));
  }, [monthTx, categories]);

  const trend = useMemo(() => {
    const recentMonths = [...months].sort().slice(-6);
    return recentMonths.map((m) => {
      const tx = transactions.filter((t) => t.date.startsWith(m));
      return {
        month: m.slice(5) + "月",
        収入: tx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
        支出: tx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
      };
    });
  }, [transactions, months]);

  function openNewForm() {
    setEditingId(null);
    setForm(emptyForm(categories, today));
    setShowForm(true);
  }

  function openEditForm(t: Transaction) {
    setEditingId(t.id);
    setForm({
      date: t.date,
      type: t.type,
      categoryId: t.categoryId,
      amount: String(t.amount),
      memo: t.memo ?? "",
    });
    setShowForm(true);
  }

  async function handleDelete(id: string) {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    await removeTransaction(id);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number(form.amount);
    if (!amount || amount <= 0) return;
    setSaving(true);

    if (editingId) {
      const updated: Transaction = {
        id: editingId,
        date: form.date,
        type: form.type,
        categoryId: form.categoryId,
        amount,
        memo: form.memo || undefined,
      };
      setTransactions((prev) => prev.map((t) => (t.id === editingId ? updated : t)));
      await editTransaction(editingId, updated);
    } else {
      const newTx: Transaction = {
        id: `t${Date.now()}`,
        date: form.date,
        type: form.type,
        categoryId: form.categoryId,
        amount,
        memo: form.memo || undefined,
      };
      setTransactions((prev) => [newTx, ...prev]);
      await addTransaction(newTx);
    }
    setSaving(false);
    setShowForm(false);
  }

  const availableCategories = categories.filter((c) => c.type === form.type);

  return (
    <div className="flex flex-col gap-6 pt-1">
      <section className="flex items-center justify-between gap-2">
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[15px] font-medium text-slate-700 shadow-sm"
        >
          {months.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={openNewForm}
          className="rounded-full bg-emerald-600 px-4 py-2 text-[14px] font-semibold text-white shadow-sm shadow-emerald-600/30 transition-transform active:scale-95"
        >
          ＋ 記録
        </button>
      </section>

      <section className="grid grid-cols-3 gap-2.5">
        <div className="rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-slate-900/5">
          <p className="text-[11px] text-slate-400">収入</p>
          <p className="mt-1 text-[16px] font-bold text-emerald-600">{formatYen(income)}</p>
        </div>
        <div className="rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-slate-900/5">
          <p className="text-[11px] text-slate-400">支出</p>
          <p className="mt-1 text-[16px] font-bold text-rose-500">{formatYen(expense)}</p>
        </div>
        <div className="rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-slate-900/5">
          <p className="text-[11px] text-slate-400">差引</p>
          <p className="mt-1 text-[16px] font-bold text-slate-900">{formatYen(income - expense)}</p>
        </div>
      </section>

      {categoryBreakdown.length > 0 && (
        <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-900/5">
          <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-slate-400">
            カテゴリ別支出
          </h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryBreakdown}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(d: { name?: string }) => d.name ?? ""}
                >
                  {categoryBreakdown.map((entry) => (
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
          月別推移
        </h2>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="month" fontSize={12} stroke="#94a3b8" />
              <YAxis fontSize={12} stroke="#94a3b8" tickFormatter={(v) => `${v / 10000}万`} />
              <Tooltip formatter={(v) => formatYen(Number(v ?? 0))} />
              <Legend />
              <Bar dataKey="収入" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="支出" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section>
        <h2 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide text-slate-400">
          明細一覧
        </h2>
        <div className="divide-y divide-slate-100 rounded-2xl bg-white shadow-sm ring-1 ring-slate-900/5">
          {monthTx.length === 0 && (
            <p className="p-4 text-[13px] text-slate-400">この月の記録はありません</p>
          )}
          {monthTx.map((t) => {
            const category = findCategoryById(categories, t.categoryId);
            return (
              <div key={t.id} className="flex items-center gap-3 p-3.5">
                <span
                  className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: category?.color }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium text-slate-800">
                    {category?.name}
                    {t.memo ? ` ・ ${t.memo}` : ""}
                  </p>
                  <p className="text-[12px] text-slate-400">{t.date}</p>
                </div>
                <p
                  className={`text-[15px] font-semibold ${
                    t.type === "income" ? "text-emerald-600" : "text-rose-500"
                  }`}
                >
                  {t.type === "income" ? "+" : "-"}
                  {formatYen(t.amount)}
                </p>
                <button
                  type="button"
                  onClick={() => openEditForm(t)}
                  className="rounded-full px-2.5 py-1.5 text-[12px] text-slate-500 active:bg-slate-100"
                >
                  編集
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(t.id)}
                  className="rounded-full px-2.5 py-1.5 text-[12px] text-rose-500 active:bg-rose-50"
                >
                  削除
                </button>
              </div>
            );
          })}
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
            <h3 className="mb-4 text-[17px] font-bold text-slate-900">
              {editingId ? "収支を編集" : "収支を記録"}
            </h3>
            <div className="flex flex-col gap-3">
              <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      type: "expense",
                      categoryId: categories.find((c) => c.type === "expense")?.id ?? "",
                    }))
                  }
                  className={`flex-1 rounded-lg py-2 text-[14px] font-semibold transition-colors ${
                    form.type === "expense"
                      ? "bg-white text-rose-500 shadow-sm"
                      : "text-slate-500"
                  }`}
                >
                  支出
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      type: "income",
                      categoryId: categories.find((c) => c.type === "income")?.id ?? "",
                    }))
                  }
                  className={`flex-1 rounded-lg py-2 text-[14px] font-semibold transition-colors ${
                    form.type === "income"
                      ? "bg-white text-emerald-600 shadow-sm"
                      : "text-slate-500"
                  }`}
                >
                  収入
                </button>
              </div>

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
                金額
                <input
                  type="number"
                  required
                  min={1}
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[16px] focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  placeholder="0"
                />
              </label>

              <label className="text-[12px] text-slate-400">
                カテゴリ
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[16px] focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                >
                  {availableCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-[12px] text-slate-400">
                メモ
                <input
                  type="text"
                  value={form.memo}
                  onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))}
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
