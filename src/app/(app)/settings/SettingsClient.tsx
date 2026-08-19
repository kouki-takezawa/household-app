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
import { ColorAvatar } from "@/components/ColorAvatar";
import { EmptyState } from "@/components/EmptyState";
import { useToast } from "@/components/Toast";
import { useConfirm } from "@/components/ConfirmDialog";
import { fieldClass, FieldError } from "@/components/form";
import { generateId } from "@/lib/id";

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
  const confirmDialog = useConfirm();
  const [tab, setTab] = useState<"members" | "categories" | "assets">("members");
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [assetAccounts, setAssetAccounts] = useState<AssetAccount[]>(initialAssetAccounts);

  const [memberName, setMemberName] = useState("");
  const [memberColor, setMemberColor] = useState(COLOR_OPTIONS[0]);
  const [memberNameError, setMemberNameError] = useState<string | null>(null);

  const [categoryName, setCategoryName] = useState("");
  const [categoryType, setCategoryType] = useState<Category["type"]>("expense");
  const [categoryColor, setCategoryColor] = useState(COLOR_OPTIONS[0]);
  const [categoryNameError, setCategoryNameError] = useState<string | null>(null);

  const [accountName, setAccountName] = useState("");
  const [accountType, setAccountType] = useState<AssetAccount["type"]>("bank");
  const [accountMemberId, setAccountMemberId] = useState("");
  const [accountNameError, setAccountNameError] = useState<string | null>(null);

  async function addMember(e: React.FormEvent) {
    e.preventDefault();
    if (!memberName.trim()) {
      setMemberNameError("名前を入力してください");
      return;
    }
    setMemberNameError(null);
    const newMember: Member = { id: generateId("m"), name: memberName.trim(), color: memberColor };
    setMembers((prev) => [...prev, newMember]);
    setMemberName("");
    try {
      await addMemberAction(newMember);
      showToast("メンバーを追加しました");
    } catch {
      setMembers((prev) => prev.filter((m) => m.id !== newMember.id));
      showToast("追加に失敗しました。もう一度お試しください", { variant: "error" });
    }
  }

  async function removeMember(target: Member) {
    const ok = await confirmDialog({
      title: "このメンバーを削除しますか？",
      description: "過去の予定などに紐づいている場合、表示に影響することがあります。",
      danger: true,
    });
    if (!ok) return;

    setMembers((prev) => prev.filter((m) => m.id !== target.id));
    try {
      await removeMemberAction(target.id);
      showToast("削除しました", {
        actionLabel: "元に戻す",
        onAction: async () => {
          setMembers((prev) => [...prev, target]);
          try {
            await addMemberAction(target);
          } catch {
            setMembers((prev) => prev.filter((m) => m.id !== target.id));
            showToast("元に戻せませんでした", { variant: "error" });
          }
        },
      });
    } catch {
      setMembers((prev) => [...prev, target]);
      showToast("削除に失敗しました。もう一度お試しください", { variant: "error" });
    }
  }

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!categoryName.trim()) {
      setCategoryNameError("カテゴリ名を入力してください");
      return;
    }
    setCategoryNameError(null);
    const newCategory: Category = {
      id: generateId("c"),
      name: categoryName.trim(),
      type: categoryType,
      color: categoryColor,
    };
    setCategories((prev) => [...prev, newCategory]);
    setCategoryName("");
    try {
      await addCategoryAction(newCategory);
      showToast("カテゴリを追加しました");
    } catch {
      setCategories((prev) => prev.filter((c) => c.id !== newCategory.id));
      showToast("追加に失敗しました。もう一度お試しください", { variant: "error" });
    }
  }

  async function removeCategory(target: Category) {
    const ok = await confirmDialog({
      title: "このカテゴリを削除しますか？",
      description: "過去の記録などに紐づいている場合、表示に影響することがあります。",
      danger: true,
    });
    if (!ok) return;

    setCategories((prev) => prev.filter((c) => c.id !== target.id));
    try {
      await removeCategoryAction(target.id);
      showToast("削除しました", {
        actionLabel: "元に戻す",
        onAction: async () => {
          setCategories((prev) => [...prev, target]);
          try {
            await addCategoryAction(target);
          } catch {
            setCategories((prev) => prev.filter((c) => c.id !== target.id));
            showToast("元に戻せませんでした", { variant: "error" });
          }
        },
      });
    } catch {
      setCategories((prev) => [...prev, target]);
      showToast("削除に失敗しました。もう一度お試しください", { variant: "error" });
    }
  }

  async function addAssetAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!accountName.trim()) {
      setAccountNameError("口座名を入力してください");
      return;
    }
    setAccountNameError(null);
    const newAccount: AssetAccount = {
      id: generateId("a"),
      name: accountName.trim(),
      type: accountType,
      memberId: accountMemberId || undefined,
    };
    setAssetAccounts((prev) => [...prev, newAccount]);
    setAccountName("");
    try {
      await addAssetAccountAction(newAccount);
      showToast("資産口座を追加しました");
    } catch {
      setAssetAccounts((prev) => prev.filter((a) => a.id !== newAccount.id));
      showToast("追加に失敗しました。もう一度お試しください", { variant: "error" });
    }
  }

  async function removeAssetAccount(target: AssetAccount) {
    const ok = await confirmDialog({
      title: "この資産口座を削除しますか？",
      description: "この口座の残高記録も資産管理画面から見えなくなります。",
      danger: true,
    });
    if (!ok) return;

    setAssetAccounts((prev) => prev.filter((a) => a.id !== target.id));
    try {
      await removeAssetAccountAction(target.id);
      showToast("削除しました", {
        actionLabel: "元に戻す",
        onAction: async () => {
          setAssetAccounts((prev) => [...prev, target]);
          try {
            await addAssetAccountAction(target);
          } catch {
            setAssetAccounts((prev) => prev.filter((a) => a.id !== target.id));
            showToast("元に戻せませんでした", { variant: "error" });
          }
        },
      });
    } catch {
      setAssetAccounts((prev) => [...prev, target]);
      showToast("削除に失敗しました。もう一度お試しください", { variant: "error" });
    }
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
            <div className="divide-y divide-line-soft rounded-2xl bg-surface shadow-card ring-1 ring-line-soft">
              {members.map((m) => (
                <div key={m.id} className="flex items-center gap-3 p-3.5">
                  <ColorAvatar label={m.name} color={m.color} size="sm" />
                  <p className="flex-1 text-[15px] font-medium text-foreground">{m.name}</p>
                  <button
                    type="button"
                    onClick={() => removeMember(m)}
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
            className="rounded-2xl bg-surface p-4 shadow-card ring-1 ring-line-soft"
          >
            <h3 className="mb-3 text-[15px] font-semibold text-foreground">メンバーを追加</h3>
            <div className="mb-3">
              <input
                type="text"
                value={memberName}
                onChange={(e) => {
                  setMemberName(e.target.value);
                  if (memberNameError) setMemberNameError(null);
                }}
                placeholder="名前"
                className={fieldClass(!!memberNameError)}
              />
              {memberNameError && <FieldError>{memberNameError}</FieldError>}
            </div>
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
              className="w-full rounded-full bg-brand py-2.5 text-[15px] font-semibold text-white shadow-sm shadow-brand/30 transition-transform active:scale-[0.98]"
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
            <div className="divide-y divide-line-soft rounded-2xl bg-surface shadow-card ring-1 ring-line-soft">
              {expenseCategories.map((c) => (
                <div key={c.id} className="flex items-center gap-3 p-3.5">
                  <ColorAvatar label={c.name} color={c.color} size="sm" />
                  <p className="flex-1 text-[15px] font-medium text-foreground">{c.name}</p>
                  <button
                    type="button"
                    onClick={() => removeCategory(c)}
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
            <div className="divide-y divide-line-soft rounded-2xl bg-surface shadow-card ring-1 ring-line-soft">
              {incomeCategories.map((c) => (
                <div key={c.id} className="flex items-center gap-3 p-3.5">
                  <ColorAvatar label={c.name} color={c.color} size="sm" />
                  <p className="flex-1 text-[15px] font-medium text-foreground">{c.name}</p>
                  <button
                    type="button"
                    onClick={() => removeCategory(c)}
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
            className="rounded-2xl bg-surface p-4 shadow-card ring-1 ring-line-soft"
          >
            <h3 className="mb-3 text-[15px] font-semibold text-foreground">カテゴリを追加</h3>
            <div className="mb-3">
              <input
                type="text"
                value={categoryName}
                onChange={(e) => {
                  setCategoryName(e.target.value);
                  if (categoryNameError) setCategoryNameError(null);
                }}
                placeholder="カテゴリ名"
                className={fieldClass(!!categoryNameError)}
              />
              {categoryNameError && <FieldError>{categoryNameError}</FieldError>}
            </div>
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
              className="w-full rounded-full bg-brand py-2.5 text-[15px] font-semibold text-white shadow-sm shadow-brand/30 transition-transform active:scale-[0.98]"
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
            <div className="divide-y divide-line-soft rounded-2xl bg-surface shadow-card ring-1 ring-line-soft">
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
                    onClick={() => removeAssetAccount(a)}
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
            className="rounded-2xl bg-surface p-4 shadow-card ring-1 ring-line-soft"
          >
            <h3 className="mb-3 text-[15px] font-semibold text-foreground">資産口座を追加</h3>
            <div className="mb-3">
              <input
                type="text"
                value={accountName}
                onChange={(e) => {
                  setAccountName(e.target.value);
                  if (accountNameError) setAccountNameError(null);
                }}
                placeholder="口座名（例: 普通預金（三井住友））"
                className={fieldClass(!!accountNameError)}
              />
              {accountNameError && <FieldError>{accountNameError}</FieldError>}
            </div>
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
                className="mt-1 w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[16px] text-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
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
              className="w-full rounded-full bg-brand py-2.5 text-[15px] font-semibold text-white shadow-sm shadow-brand/30 transition-transform active:scale-[0.98]"
            >
              追加
            </button>
          </form>
        </>
      )}
    </div>
  );
}
