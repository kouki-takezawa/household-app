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
  type Member,
  type Transaction,
  findCategoryById,
  findMemberById,
  formatYen,
  todayStr,
} from "@/lib/types";
import { addTransaction, editTransaction, removeTransaction } from "@/lib/actions";
import { ColorAvatar } from "@/components/ColorAvatar";
import { EmptyState } from "@/components/EmptyState";
import { Collapsible } from "@/components/Collapsible";
import { BottomSheet, SheetActions } from "@/components/BottomSheet";
import { AmountField } from "@/components/AmountField";
import { MemberFilterChips } from "@/components/MemberFilterChips";
import { IconButton, PencilIcon, TrashIcon } from "@/components/icons";
import { useToast } from "@/components/Toast";
import { useConfirm } from "@/components/ConfirmDialog";
import { fieldClass, FieldError } from "@/components/form";
import { chartTooltipStyle, chartLegendStyle } from "@/lib/chartTheme";
import { generateId } from "@/lib/id";
import { describeError } from "@/lib/errors";

function monthOptions(txs: Transaction[], defaultMonth: string): string[] {
  const set = new Set(txs.map((t) => t.date.slice(0, 7)));
  set.add(defaultMonth);
  return [...set].sort().reverse();
}

function yearOptions(txs: Transaction[], defaultYear: string): string[] {
  const set = new Set(txs.map((t) => t.date.slice(0, 4)));
  set.add(defaultYear);
  return [...set].sort().reverse();
}

function emptyForm(categories: Category[], members: Member[], today: string) {
  return {
    date: today,
    type: "expense" as "income" | "expense",
    categoryId: categories.find((c) => c.type === "expense")?.id ?? "",
    memberId: members[0]?.id ?? "",
    amount: "",
    memo: "",
  };
}

export default function BudgetClient({
  categories,
  members,
  initialTransactions,
}: {
  categories: Category[];
  members: Member[];
  initialTransactions: Transaction[];
}) {
  const today = todayStr();
  const defaultMonth = today.slice(0, 7);
  const defaultYear = today.slice(0, 4);
  const showToast = useToast();
  const confirmDialog = useConfirm();

  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [periodMode, setPeriodMode] = useState<"month" | "year">("month");
  const [month, setMonth] = useState(defaultMonth);
  const [year, setYear] = useState(defaultYear);
  const [memberFilter, setMemberFilter] = useState<Set<string>>(
    new Set(members.map((m) => m.id))
  );
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => emptyForm(categories, members, today));
  const [amountError, setAmountError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const months = useMemo(() => monthOptions(transactions, defaultMonth), [transactions, defaultMonth]);
  const years = useMemo(() => yearOptions(transactions, defaultYear), [transactions, defaultYear]);

  function toggleMember(id: string) {
    setMemberFilter((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const memberFilteredTx = useMemo(
    () => transactions.filter((t) => !t.memberId || memberFilter.has(t.memberId)),
    [transactions, memberFilter]
  );

  const periodTx = useMemo(() => {
    const prefix = periodMode === "month" ? month : year;
    return memberFilteredTx
      .filter((t) => t.date.startsWith(prefix))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [memberFilteredTx, periodMode, month, year]);

  const isSearching = searchQuery.trim().length > 0;

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return memberFilteredTx
      .filter((t) => {
        const categoryName = findCategoryById(categories, t.categoryId)?.name ?? "";
        return (
          (t.memo ?? "").toLowerCase().includes(q) || categoryName.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [memberFilteredTx, categories, searchQuery]);

  const visibleTx = isSearching ? searchResults : periodTx;

  const income = periodTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = periodTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of periodTx) {
      if (t.type !== "expense") continue;
      map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + t.amount);
    }
    const total = [...map.values()].reduce((s, v) => s + v, 0);
    return [...map.entries()]
      .map(([categoryId, value]) => ({
        name: findCategoryById(categories, categoryId)?.name ?? "その他",
        value,
        color: findCategoryById(categories, categoryId)?.color ?? "#94a3b8",
        percent: total > 0 ? (value / total) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [periodTx, categories]);

  const monthlyTrend = useMemo(() => {
    const recentMonths = [...months].sort().slice(-6);
    return recentMonths.map((m) => {
      const tx = memberFilteredTx.filter((t) => t.date.startsWith(m));
      return {
        label: m.slice(5) + "月",
        収入: tx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
        支出: tx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
      };
    });
  }, [memberFilteredTx, months]);

  const yearlyTrend = useMemo(() => {
    return [...years].sort().map((y) => {
      const tx = memberFilteredTx.filter((t) => t.date.startsWith(y));
      return {
        label: y + "年",
        収入: tx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
        支出: tx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
      };
    });
  }, [memberFilteredTx, years]);

  const trend = periodMode === "month" ? monthlyTrend : yearlyTrend;

  function openNewForm() {
    setEditingId(null);
    setAmountError(null);
    setForm(emptyForm(categories, members, today));
    setShowForm(true);
  }

  function openEditForm(t: Transaction) {
    setEditingId(t.id);
    setAmountError(null);
    setForm({
      date: t.date,
      type: t.type,
      categoryId: t.categoryId,
      memberId: t.memberId ?? members[0]?.id ?? "",
      amount: String(t.amount),
      memo: t.memo ?? "",
    });
    setShowForm(true);
  }

  async function handleDelete(target: Transaction) {
    const ok = await confirmDialog({
      title: "この記録を削除しますか？",
      danger: true,
    });
    if (!ok) return;

    setTransactions((prev) => prev.filter((t) => t.id !== target.id));
    try {
      await removeTransaction(target.id);
      showToast("削除しました", {
        actionLabel: "元に戻す",
        onAction: async () => {
          setTransactions((prev) => [target, ...prev]);
          try {
            await addTransaction(target);
          } catch (err) {
            setTransactions((prev) => prev.filter((t) => t.id !== target.id));
            showToast(describeError(err, "元に戻せませんでした"), { variant: "error" });
          }
        },
      });
    } catch (err) {
      setTransactions((prev) => [target, ...prev]);
      showToast(describeError(err, "削除に失敗しました"), { variant: "error" });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number(form.amount);
    if (!amount || amount <= 0) {
      setAmountError("金額を入力してください");
      return;
    }
    setAmountError(null);
    setSaving(true);

    if (editingId) {
      const previous = transactions.find((t) => t.id === editingId);
      const updated: Transaction = {
        id: editingId,
        date: form.date,
        type: form.type,
        categoryId: form.categoryId,
        memberId: form.memberId || undefined,
        amount,
        memo: form.memo || undefined,
      };
      setTransactions((prev) => prev.map((t) => (t.id === editingId ? updated : t)));
      try {
        await editTransaction(editingId, updated);
        showToast("更新しました");
        setShowForm(false);
      } catch (err) {
        if (previous) {
          setTransactions((prev) => prev.map((t) => (t.id === editingId ? previous : t)));
        }
        showToast(describeError(err, "更新に失敗しました"), { variant: "error" });
      }
    } else {
      const newTx: Transaction = {
        id: generateId("t"),
        date: form.date,
        type: form.type,
        categoryId: form.categoryId,
        memberId: form.memberId || undefined,
        amount,
        memo: form.memo || undefined,
      };
      setTransactions((prev) => [newTx, ...prev]);
      try {
        await addTransaction(newTx);
        showToast("保存しました");
        setShowForm(false);
      } catch (err) {
        setTransactions((prev) => prev.filter((t) => t.id !== newTx.id));
        showToast(describeError(err, "保存に失敗しました"), { variant: "error" });
      }
    }
    setSaving(false);
  }

  const availableCategories = categories.filter((c) => c.type === form.type);

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2.5">
        <div className="flex w-fit gap-1 rounded-xl bg-track p-1 text-[13px]">
          <button
            type="button"
            onClick={() => setPeriodMode("month")}
            className={`rounded-lg px-3 py-1.5 font-semibold transition-colors ${
              periodMode === "month" ? "bg-surface text-foreground shadow-sm" : "text-subtle"
            }`}
          >
            月次
          </button>
          <button
            type="button"
            onClick={() => setPeriodMode("year")}
            className={`rounded-lg px-3 py-1.5 font-semibold transition-colors ${
              periodMode === "year" ? "bg-surface text-foreground shadow-sm" : "text-subtle"
            }`}
          >
            年次
          </button>
        </div>

        <div className="flex items-center justify-between gap-2">
          {periodMode === "month" ? (
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="rounded-full border border-line bg-surface px-4 py-2 text-[15px] font-medium text-foreground shadow-sm"
            >
              {months.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          ) : (
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="rounded-full border border-line bg-surface px-4 py-2 text-[15px] font-medium text-foreground shadow-sm"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}年
                </option>
              ))}
            </select>
          )}
          <button type="button" onClick={openNewForm} className="btn-add">
            ＋ 記録
          </button>
        </div>
      </section>

      <MemberFilterChips members={members} selected={memberFilter} onToggle={toggleMember} />

      <section className="grid grid-cols-3 gap-2.5">
        <div className="rounded-2xl bg-surface p-3.5 shadow-card ring-1 ring-line-soft">
          <p className="text-[11px] text-muted">収入</p>
          <p className="mt-1 text-[16px] font-bold tabular-nums text-emerald-600">{formatYen(income)}</p>
        </div>
        <div className="rounded-2xl bg-surface p-3.5 shadow-card ring-1 ring-line-soft">
          <p className="text-[11px] text-muted">支出</p>
          <p className="mt-1 text-[16px] font-bold tabular-nums text-rose-500">{formatYen(expense)}</p>
        </div>
        <div className="rounded-2xl bg-surface p-3.5 shadow-card ring-1 ring-line-soft">
          <p className="text-[11px] text-muted">差引</p>
          <p className="mt-1 text-[16px] font-bold tabular-nums text-foreground">{formatYen(income - expense)}</p>
        </div>
      </section>

      <Collapsible
        title="グラフを見る"
        icon={
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
            <path d="M2 13.5h12M4.5 13.5V8M8 13.5V3.5M11.5 13.5V6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        }
      >
        <div className="flex flex-col gap-6 pt-1">
          <div>
            <h3 className="mb-2 text-[12px] font-semibold text-subtle">カテゴリ別支出</h3>
            {categoryBreakdown.length > 0 ? (
              <>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                        {categoryBreakdown.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => formatYen(Number(v ?? 0))} {...chartTooltipStyle()} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 flex flex-col gap-2.5">
                  {categoryBreakdown.map((c) => (
                    <div key={c.name} className="flex items-center gap-3">
                      <p className="w-24 flex-shrink-0 truncate text-[12px] text-foreground sm:w-28" title={c.name}>
                        {c.name}
                      </p>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-track">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${c.percent}%`, backgroundColor: c.color }}
                        />
                      </div>
                      <p className="w-11 flex-shrink-0 text-right text-[12px] tabular-nums text-muted">
                        {c.percent.toFixed(0)}%
                      </p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex h-56 flex-col items-center justify-center gap-2">
                <svg viewBox="0 0 80 80" className="h-20 w-20 text-line" fill="none">
                  <circle cx="40" cy="40" r="32" stroke="currentColor" strokeWidth="14" strokeDasharray="70 130" />
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    stroke="currentColor"
                    strokeWidth="14"
                    strokeDasharray="35 165"
                    strokeDashoffset="-70"
                    opacity="0.5"
                  />
                </svg>
                <p className="text-[12px] text-muted">支出を記録すると内訳が表示されます</p>
              </div>
            )}
          </div>

          <div>
            <h3 className="mb-2 text-[12px] font-semibold text-subtle">
              {periodMode === "month" ? "月別推移（直近6ヶ月）" : "年別推移"}
            </h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
                  <XAxis dataKey="label" fontSize={12} stroke="var(--muted)" />
                  <YAxis fontSize={12} stroke="var(--muted)" tickFormatter={(v) => `${v / 10000}万`} />
                  <Tooltip formatter={(v) => formatYen(Number(v ?? 0))} {...chartTooltipStyle()} />
                  <Legend wrapperStyle={chartLegendStyle()} />
                  <Bar dataKey="収入" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="支出" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </Collapsible>

      <section style={{ marginTop: "var(--space-xs)" }}>
        <div className="mb-2 flex items-center justify-between px-1">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted">
            {isSearching ? "検索結果" : "明細一覧"}
          </h2>
        </div>
        <div className="relative mb-2">
          <svg
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="9" cy="9" r="6" />
            <path d="m17 17-3.5-3.5" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="カテゴリ・メモで検索（全期間）"
            className="w-full rounded-full border border-line bg-surface py-2.5 pl-10 pr-9 text-[15px] text-foreground shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-track text-[11px] text-subtle active:opacity-70"
              aria-label="検索をクリア"
            >
              ✕
            </button>
          )}
        </div>
        <div className="divide-y divide-line-soft rounded-2xl bg-surface shadow-card ring-1 ring-line-soft">
          {visibleTx.length === 0 && (
            <EmptyState
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                  <rect x="3.5" y="6" width="17" height="12" rx="2.5" />
                  <path d="M3.5 10h17" />
                </svg>
              }
              message={isSearching ? "該当する記録が見つかりません" : "この期間の記録はありません"}
              actionLabel={isSearching ? undefined : "記録を追加"}
              onAction={isSearching ? undefined : openNewForm}
            />
          )}
          {visibleTx.map((t) => {
            const category = findCategoryById(categories, t.categoryId);
            const member = findMemberById(members, t.memberId);
            return (
              <div key={t.id} className="flex items-center gap-3 p-3.5">
                <ColorAvatar label={category?.name ?? "?"} color={category?.color} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium text-foreground">
                    {category?.name}
                    {t.memo ? ` ・ ${t.memo}` : ""}
                  </p>
                  <p className="truncate text-[12px] text-muted">
                    {t.date}
                    {member ? ` ・ ${member.name}` : ""}
                  </p>
                </div>
                <p
                  className={`text-[15px] font-semibold tabular-nums ${
                    t.type === "income" ? "text-emerald-600" : "text-rose-500"
                  }`}
                >
                  {t.type === "income" ? "+" : "-"}
                  {formatYen(t.amount)}
                </p>
                <IconButton label="編集" onClick={() => openEditForm(t)}>
                  <PencilIcon />
                </IconButton>
                <IconButton label="削除" variant="danger" onClick={() => handleDelete(t)}>
                  <TrashIcon />
                </IconButton>
              </div>
            );
          })}
        </div>
      </section>

      {showForm && (
        <BottomSheet title={editingId ? "収支を編集" : "収支を記録"} onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex gap-1 rounded-xl bg-track p-1">
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
                    ? "bg-surface text-rose-500 shadow-sm"
                    : "text-subtle"
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
                    ? "bg-surface text-emerald-600 shadow-sm"
                    : "text-subtle"
                }`}
              >
                収入
              </button>
            </div>

            <label className="text-[12px] text-muted">
              日付
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className={fieldClass()}
              />
            </label>

            <label className="text-[12px] text-muted">
              金額
              <AmountField
                value={form.amount}
                onChange={(raw) => {
                  setForm((f) => ({ ...f, amount: raw }));
                  if (amountError) setAmountError(null);
                }}
                hasError={!!amountError}
              />
              {amountError && <FieldError>{amountError}</FieldError>}
            </label>

            <label className="text-[12px] text-muted">
              カテゴリ
              <select
                value={form.categoryId}
                onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                className={fieldClass()}
              >
                {availableCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-[12px] text-muted">
              記録者
              <select
                value={form.memberId}
                onChange={(e) => setForm((f) => ({ ...f, memberId: e.target.value }))}
                className={fieldClass()}
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-[12px] text-muted">
              メモ
              <input
                type="text"
                value={form.memo}
                onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))}
                className={fieldClass()}
                placeholder="任意"
              />
            </label>

            <SheetActions onCancel={() => setShowForm(false)} submitLabel="保存" saving={saving} />
          </form>
        </BottomSheet>
      )}
    </div>
  );
}
