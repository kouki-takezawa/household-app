"use client";

import { useState } from "react";
import clsx from "clsx";
import {
  type Member,
  type Category,
  type AssetAccount,
  ASSET_TYPE_LABEL,
} from "@/lib/types";
import {
  addMember as addMemberAction,
  removeMember as removeMemberAction,
  addCategory as addCategoryAction,
  removeCategory as removeCategoryAction,
  addAssetAccount as addAssetAccountAction,
  removeAssetAccount as removeAssetAccountAction,
} from "@/lib/actions";
import { EmptyState } from "@/components/EmptyState";
import { useToast } from "@/components/Toast";

const COLOR_OPTIONS = [
  "#10b981",
  "#3b82f6",
  "#ec4899",
  "#f97316",
  "#8b5cf6",
  "#06b6d4",
  "#eab308",
  "#f43f5e",
];

const ASSET_TYPES: AssetAccount["type"][] = ["bank", "cash", "investment"];

export default function SettingsClient({
  initialMembers,
  initialCategories,
  initialAssetAccounts,
}: {
  initialMembers: Member[];
  initialCategories: Category[];
  initialAssetAccounts: AssetAccount[];
}) {
  const showToast = useToast();
  const [tab, setTab] = useState<"members" | "categories" | "assets">("members");
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [assetAccounts, setAssetAccounts] = useState<AssetAccount[]>(initialAssetAccounts);

  const [memberName, setMemberName] = useState("");
  const [memberColor, setMemberColor] = useState(COLOR_OPTIONS[0]);

  const [categoryName, setCategoryName] = useState("");
  const [categoryType, setCategoryType] = useState<Category["type"]>("expense");
  const [categoryColor, setCategoryColor] = useState(COLOR_OPTIONS[0]);

  const [accountName, setAccountName] = useState("");
  const [accountType, setAccountType] = useState<AssetAccount["type"]>("bank");
  const [accountMemberId, setAccountMemberId] = useState("");

  async function addMember(e: React.FormEvent) {
    e.preventDefault();
    if (!memberName.trim()) return;
    const newMember: Member = { id: `m${Date.now()}`, name: memberName.trim(), color: memberColor };
    setMembers((prev) => [...prev, newMember]);
    setMemberName("");
    await addMemberAction(newMember);
    showToast("メンバーを追加しました");
  }

  async function removeMember(id: string) {
    if (!confirm("このメンバーを削除しますか？\n過去の予定などに紐づいている場合、表示に影響することがあります。")) return;
    setMembers((prev) => prev.filter((m) => m.id !== id));
    await removeMemberAction(id);
    showToast("削除しました");
  }

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!categoryName.trim()) return;
    const newCategory: Category = {
      id: `c${Date.now()}`,
      name: categoryName.trim(),
      type: categoryType,
      color: categoryColor,
    };
    setCategories((prev) => [...prev, newCategory]);
    setCategoryName("");
    await addCategoryAction(newCategory);
    showToast("カテゴリを追加しました");
  }

  async function removeCategory(id: string) {
    if (!confirm("このカテゴリを削除しますか？\n過去の記録などに紐づいている場合、表示に影響することがあります。")) return;
    setCategories((prev) => prev.filter((c) => c.id !== id));
    await removeCategoryAction(id);
    showToast("削除しました");
  }

  async function addAssetAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!accountName.trim()) return;
    const newAccount: AssetAccount = {
      id: `a${Date.now()}`,
      name: accountName.trim(),
      type: accountType,
      memberId: accountMemberId || undefined,
    };
    setAssetAccounts((prev) => [...prev, newAccount]);
    setAccountName("");
    await addAssetAccountAction(newAccount);
    showToast("資産口座を追加しました");
  }

  async function removeAssetAccount(id: string) {
    if (!confirm("この資産口座を削除しますか？\nこの口座の残高記録も資産管理画面から見えなくなります。")) return;
    setAssetAccounts((prev) => prev.filter((a) => a.id !== id));
    await removeAssetAccountAction(id);
    showToast("削除しました");
  }

  const expenseCategories = categories.filter((c) => c.type === "expense");
  const incomeCategories = categories.filter((c) => c.type === "income");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-1 rounded-xl bg-track p-1 text-[13px]">
        <button
          type="button"
          onClick={() => setTab("members")}
          className={clsx(
            "flex-1 rounded-lg py-2 font-semibold transition-colors",
            tab === "members" ? "bg-surface text-brand shadow-sm" : "text-subtle"
          )}
        >
          メンバー
        </button>
        <button
          type="button"
          onClick={() => setTab("categories")}
          className={clsx(
            "flex-1 rounded-lg py-2 font-semibold transition-colors",
            tab === "categories" ? "bg-surface text-brand shadow-sm" : "text-subtle"
          )}
        >
          カテゴリ
        </button>
        <button
          type="button"
          onClick={() => setTab("assets")}
          className={clsx(
            "flex-1 rounded-lg py-2 font-semibold transition-colors",
            tab === "assets" ? "bg-surface text-brand shadow-sm" : "text-subtle"
          )}
        >
          資産口座
        </button>
      </div>

      {tab === "members" && (
        <>
          <section>
            <p className="mb-2 px-1 text-[12px] text-muted">
              日程表の色分け・フィルターに使うメンバーです。
            </p>
            <div className="divide-y divide-line-soft rounded-2xl bg-surface shadow-[0_2px_20px_-6px_rgba(120,90,40,0.14)] ring-1 ring-line-soft">
              {members.map((m) => (
                <div key={m.id} className="flex items-center gap-3 p-3.5">
                  <span
                    className="h-3 w-3 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: m.color }}
                  />
                  <p className="flex-1 text-[15px] font-medium text-foreground">{m.name}</p>
                  <button
                    type="button"
                    onClick={() => removeMember(m.id)}
                    className="rounded-full px-2.5 py-1.5 text-[12px] text-rose-500 active:bg-rose-500/10"
                  >
                    削除
                  </button>
                </div>
              ))}
            </div>
          </section>

          <form
            onSubmit={addMember}
            className="rounded-2xl bg-surface p-4 shadow-[0_2px_20px_-6px_rgba(120,90,40,0.14)] ring-1 ring-line-soft"
          >
            <h3 className="mb-3 text-[15px] font-semibold text-foreground">メンバーを追加</h3>
            <input
              type="text"
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              placeholder="名前"
              className="mb-3 w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[16px] text-foreground focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            />
            <div className="mb-3 flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setMemberColor(color)}
                  className={clsx(
                    "h-8 w-8 rounded-full ring-2 ring-offset-2 ring-offset-surface transition-transform active:scale-90",
                    memberColor === color ? "ring-muted" : "ring-transparent"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <button
              type="submit"
              className="w-full rounded-full bg-amber-600 py-2.5 text-[15px] font-semibold text-white shadow-sm shadow-amber-600/30 transition-transform active:scale-[0.98]"
            >
              追加
            </button>
          </form>
        </>
      )}

      {tab === "categories" && (
        <>
          <section>
            <p className="mb-2 px-1 text-[12px] text-muted">支出カテゴリ</p>
            <div className="divide-y divide-line-soft rounded-2xl bg-surface shadow-[0_2px_20px_-6px_rgba(120,90,40,0.14)] ring-1 ring-line-soft">
              {expenseCategories.map((c) => (
                <div key={c.id} className="flex items-center gap-3 p-3.5">
                  <span
                    className="h-3 w-3 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: c.color }}
                  />
                  <p className="flex-1 text-[15px] font-medium text-foreground">{c.name}</p>
                  <button
                    type="button"
                    onClick={() => removeCategory(c.id)}
                    className="rounded-full px-2.5 py-1.5 text-[12px] text-rose-500 active:bg-rose-500/10"
                  >
                    削除
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section>
            <p className="mb-2 px-1 text-[12px] text-muted">収入カテゴリ</p>
            <div className="divide-y divide-line-soft rounded-2xl bg-surface shadow-[0_2px_20px_-6px_rgba(120,90,40,0.14)] ring-1 ring-line-soft">
              {incomeCategories.map((c) => (
                <div key={c.id} className="flex items-center gap-3 p-3.5">
                  <span
                    className="h-3 w-3 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: c.color }}
                  />
                  <p className="flex-1 text-[15px] font-medium text-foreground">{c.name}</p>
                  <button
                    type="button"
                    onClick={() => removeCategory(c.id)}
                    className="rounded-full px-2.5 py-1.5 text-[12px] text-rose-500 active:bg-rose-500/10"
                  >
                    削除
                  </button>
                </div>
              ))}
            </div>
          </section>

          <form
            onSubmit={addCategory}
            className="rounded-2xl bg-surface p-4 shadow-[0_2px_20px_-6px_rgba(120,90,40,0.14)] ring-1 ring-line-soft"
          >
            <h3 className="mb-3 text-[15px] font-semibold text-foreground">カテゴリを追加</h3>
            <input
              type="text"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="カテゴリ名"
              className="mb-3 w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[16px] text-foreground focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            />
            <div className="mb-3 flex gap-1 rounded-xl bg-track p-1">
              <button
                type="button"
                onClick={() => setCategoryType("expense")}
                className={clsx(
                  "flex-1 rounded-lg py-2 text-[14px] font-semibold transition-colors",
                  categoryType === "expense"
                    ? "bg-surface text-rose-500 shadow-sm"
                    : "text-subtle"
                )}
              >
                支出
              </button>
              <button
                type="button"
                onClick={() => setCategoryType("income")}
                className={clsx(
                  "flex-1 rounded-lg py-2 text-[14px] font-semibold transition-colors",
                  categoryType === "income"
                    ? "bg-surface text-emerald-600 shadow-sm"
                    : "text-subtle"
                )}
              >
                収入
              </button>
            </div>
            <div className="mb-3 flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setCategoryColor(color)}
                  className={clsx(
                    "h-8 w-8 rounded-full ring-2 ring-offset-2 ring-offset-surface transition-transform active:scale-90",
                    categoryColor === color ? "ring-muted" : "ring-transparent"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <button
              type="submit"
              className="w-full rounded-full bg-amber-600 py-2.5 text-[15px] font-semibold text-white shadow-sm shadow-amber-600/30 transition-transform active:scale-[0.98]"
            >
              追加
            </button>
          </form>
        </>
      )}

      {tab === "assets" && (
        <>
          <section>
            <p className="mb-2 px-1 text-[12px] text-muted">
              資産管理画面の「資産口座一覧」に表示される口座です。
            </p>
            <div className="divide-y divide-line-soft rounded-2xl bg-surface shadow-[0_2px_20px_-6px_rgba(120,90,40,0.14)] ring-1 ring-line-soft">
              {assetAccounts.length === 0 && (
                <EmptyState
                  icon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                      <path d="M4 19V10M10 19V5M16 19v-7M21 19H3" />
                    </svg>
                  }
                  message="資産口座がありません"
                />
              )}
              {assetAccounts.map((a) => (
                <div key={a.id} className="flex items-center gap-3 p-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium text-foreground">{a.name}</p>
                    <p className="text-[12px] text-muted">{ASSET_TYPE_LABEL[a.type]}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAssetAccount(a.id)}
                    className="rounded-full px-2.5 py-1.5 text-[12px] text-rose-500 active:bg-rose-500/10"
                  >
                    削除
                  </button>
                </div>
              ))}
            </div>
          </section>

          <form
            onSubmit={addAssetAccount}
            className="rounded-2xl bg-surface p-4 shadow-[0_2px_20px_-6px_rgba(120,90,40,0.14)] ring-1 ring-line-soft"
          >
            <h3 className="mb-3 text-[15px] font-semibold text-foreground">資産口座を追加</h3>
            <input
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="口座名（例: 普通預金（三井住友））"
              className="mb-3 w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[16px] text-foreground focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            />
            <div className="mb-3 flex gap-1 rounded-xl bg-track p-1">
              {ASSET_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setAccountType(t)}
                  className={clsx(
                    "flex-1 rounded-lg py-2 text-[13px] font-semibold transition-colors",
                    accountType === t ? "bg-surface text-brand shadow-sm" : "text-subtle"
                  )}
                >
                  {ASSET_TYPE_LABEL[t]}
                </button>
              ))}
            </div>
            <label className="mb-3 block text-[12px] text-muted">
              名義（任意）
              <select
                value={accountMemberId}
                onChange={(e) => setAccountMemberId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[16px] text-foreground focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              >
                <option value="">未設定</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="w-full rounded-full bg-amber-600 py-2.5 text-[15px] font-semibold text-white shadow-sm shadow-amber-600/30 transition-transform active:scale-[0.98]"
            >
              追加
            </button>
          </form>
        </>
      )}
    </div>
  );
}
