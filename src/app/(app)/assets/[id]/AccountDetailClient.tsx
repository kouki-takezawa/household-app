"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  type AssetAccount,
  type AssetSnapshot,
  type Member,
  ASSET_TYPE_LABEL as TYPE_LABEL,
  findMemberById,
  formatYen,
  todayStr,
} from "@/lib/types";
import { addAssetSnapshot, editAssetSnapshot, removeAssetSnapshot } from "@/lib/actions";
import { SlidePage } from "@/components/SlidePage";
import { EmptyState } from "@/components/EmptyState";
import { useToast } from "@/components/Toast";
import { useConfirm } from "@/components/ConfirmDialog";
import { fieldClass, FieldError } from "@/components/form";
import { generateId } from "@/lib/id";

function emptyForm(today: string) {
  return { date: today, value: "", note: "" };
}

export default function AccountDetailClient({
  account,
  initialSnapshots,
  members,
}: {
  account: AssetAccount;
  initialSnapshots: AssetSnapshot[];
  members: Member[];
}) {
  const today = todayStr();
  const showToast = useToast();
  const confirmDialog = useConfirm();
  const member = findMemberById(members, account.memberId);

  const [snapshots, setSnapshots] = useState<AssetSnapshot[]>(initialSnapshots);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => emptyForm(today));
  const [valueError, setValueError] = useState<string | null>(null);

  const history = useMemo(
    () => [...snapshots].sort((a, b) => b.date.localeCompare(a.date)),
    [snapshots]
  );
  const latest = history[0];

  const trend = useMemo(
    () =>
      [...snapshots]
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((s) => ({ date: s.date.slice(5), 評価額: s.value })),
    [snapshots]
  );

  function openNewForm() {
    setEditingId(null);
    setValueError(null);
    setForm(emptyForm(today));
    setShowForm(true);
  }

  function openEditForm(snapshot: AssetSnapshot) {
    setEditingId(snapshot.id);
    setValueError(null);
    setForm({ date: snapshot.date, value: String(snapshot.value), note: snapshot.note ?? "" });
    setShowForm(true);
  }

  async function handleDelete(target: AssetSnapshot) {
    const ok = await confirmDialog({ title: "この記録を削除しますか？", danger: true });
    if (!ok) return;

    setSnapshots((prev) => prev.filter((s) => s.id !== target.id));
    try {
      await removeAssetSnapshot(target.id);
      showToast("削除しました", {
        actionLabel: "元に戻す",
        onAction: async () => {
          setSnapshots((prev) => [...prev, target]);
          try {
            await addAssetSnapshot(target);
          } catch {
            setSnapshots((prev) => prev.filter((s) => s.id !== target.id));
            showToast("元に戻せませんでした", { variant: "error" });
          }
        },
      });
    } catch {
      setSnapshots((prev) => [...prev, target]);
      showToast("削除に失敗しました。もう一度お試しください", { variant: "error" });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(form.value);
    if (form.value === "" || Number.isNaN(value) || value < 0) {
      setValueError("残高・評価額を入力してください");
      return;
    }
    setValueError(null);
    setSaving(true);

    if (editingId) {
      const previous = snapshots.find((s) => s.id === editingId);
      const updated: AssetSnapshot = {
        id: editingId,
        assetAccountId: account.id,
        date: form.date,
        value,
        note: form.note || undefined,
      };
      setSnapshots((prev) => prev.map((s) => (s.id === editingId ? updated : s)));
      try {
        await editAssetSnapshot(editingId, updated);
        showToast("更新しました");
        setShowForm(false);
      } catch {
        if (previous) {
          setSnapshots((prev) => prev.map((s) => (s.id === editingId ? previous : s)));
        }
        showToast("更新に失敗しました。もう一度お試しください", { variant: "error" });
      }
    } else {
      const newSnapshot: AssetSnapshot = {
        id: generateId("s"),
        assetAccountId: account.id,
        date: form.date,
        value,
        note: form.note || undefined,
      };
      setSnapshots((prev) => [...prev, newSnapshot]);
      try {
        await addAssetSnapshot(newSnapshot);
        showToast("記録しました");
        setShowForm(false);
      } catch {
        setSnapshots((prev) => prev.filter((s) => s.id !== newSnapshot.id));
        showToast("記録に失敗しました。もう一度お試しください", { variant: "error" });
      }
    }
    setSaving(false);
  }

  return (
    <SlidePage title={account.name}>
      <div className="flex flex-col gap-5 pt-2">
        <div className="rounded-2xl bg-surface p-5 shadow-card ring-1 ring-line-soft">
          <p className="text-[13px] text-muted">
            {TYPE_LABEL[account.type]}
            {member ? ` ・ ${member.name}` : ""}
          </p>
          <p className="mt-1 text-[32px] font-bold leading-tight tabular-nums text-foreground">
            {latest ? formatYen(latest.value) : "未記録"}
          </p>
          {latest && <p className="mt-1 text-[12px] text-muted">最終更新 {latest.date}</p>}
          <button
            type="button"
            onClick={openNewForm}
            className="mt-4 w-full rounded-full bg-brand py-2.5 text-[14px] font-semibold text-white shadow-sm shadow-brand/30 transition-transform active:scale-[0.98]"
          >
            ＋ 残高・評価額を記録
          </button>
        </div>

        {trend.length > 1 && (
          <div className="rounded-2xl bg-surface p-4 shadow-card ring-1 ring-line-soft">
            <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-muted">
              推移
            </h2>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend}>
                  <defs>
                    <linearGradient id="accountValueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
                  <XAxis dataKey="date" fontSize={12} stroke="var(--muted)" />
                  <YAxis fontSize={12} stroke="var(--muted)" tickFormatter={(v) => `${v / 10000}万`} />
                  <Tooltip formatter={(v) => formatYen(Number(v ?? 0))} />
                  <Area
                    type="monotone"
                    dataKey="評価額"
                    stroke="var(--brand)"
                    strokeWidth={2.5}
                    fill="url(#accountValueGradient)"
                    dot={{ r: 3 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div>
          <h2 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide text-muted">
            記録履歴
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
              />
            )}
            {history.map((s) => (
              <div key={s.id} className="flex items-center gap-3 p-3.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium tabular-nums text-foreground">
                    {formatYen(s.value)}
                  </p>
                  <p className="text-[12px] text-muted">
                    {s.date}
                    {s.note ? ` ・ ${s.note}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openEditForm(s)}
                  className="rounded-full px-2.5 py-1.5 text-[12px] text-subtle active:opacity-70"
                >
                  編集
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(s)}
                  className="rounded-full px-2.5 py-1.5 text-[12px] text-rose-500 active:bg-rose-500/10"
                >
                  削除
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-sm rounded-t-3xl bg-surface px-5 pt-3 shadow-xl sm:rounded-3xl sm:pt-5"
            style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
          >
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line sm:hidden" />
            <h3 className="mb-4 text-[17px] font-bold text-foreground">
              {editingId ? "記録を編集" : "残高・評価額を記録"}
            </h3>
            <div className="flex flex-col gap-3">
              <label className="text-[12px] text-muted">
                日付
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[16px] text-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                />
              </label>
              <label className="text-[12px] text-muted">
                残高・評価額
                <input
                  type="number"
                  value={form.value}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, value: e.target.value }));
                    if (valueError) setValueError(null);
                  }}
                  className={fieldClass(!!valueError)}
                  placeholder="0"
                />
                {valueError && <FieldError>{valueError}</FieldError>}
              </label>
              <label className="text-[12px] text-muted">
                メモ
                <input
                  type="text"
                  value={form.note}
                  onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[16px] text-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                  placeholder="任意"
                />
              </label>
            </div>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 rounded-full border border-line py-3 text-[15px] font-semibold text-subtle active:opacity-70"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-full bg-brand py-3 text-[15px] font-semibold text-white shadow-sm shadow-brand/30 transition-transform active:scale-[0.98] disabled:opacity-60"
              >
                {saving ? "保存中…" : "保存"}
              </button>
            </div>
          </form>
        </div>
      )}
    </SlidePage>
  );
}
