"use server";

import { revalidatePath } from "next/cache";
import * as gas from "./gas";
import type {
  AssetAccount,
  AssetSnapshot,
  Category,
  CurrencyCode,
  Member,
  ScheduleEvent,
  Transaction,
} from "./types";

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/budget");
  revalidatePath("/schedule");
  revalidatePath("/schedule/[id]", "page");
  revalidatePath("/assets");
  revalidatePath("/assets/[id]", "page");
  revalidatePath("/settings");
}

// ---- Transactions ----------------------------------------------------

export async function addTransaction(data: Transaction) {
  await gas.createRow("Transactions", data);
  revalidateAll();
}

export async function editTransaction(id: string, data: Partial<Transaction>) {
  await gas.updateRow("Transactions", id, data);
  revalidateAll();
}

export async function removeTransaction(id: string) {
  await gas.deleteRow("Transactions", id);
  revalidateAll();
}

// ---- Schedule events ---------------------------------------------------

export async function addEvent(data: ScheduleEvent) {
  await gas.createRow("Events", data);
  revalidateAll();
}

export async function editEvent(id: string, data: Partial<ScheduleEvent>) {
  await gas.updateRow("Events", id, data);
  revalidateAll();
}

export async function removeEvent(id: string) {
  await gas.deleteRow("Events", id);
  revalidateAll();
}

// ---- Asset snapshots -----------------------------------------------------

export async function addAssetSnapshot(data: AssetSnapshot) {
  await gas.createRow("AssetSnapshots", data);
  revalidateAll();
}

export async function editAssetSnapshot(id: string, data: Partial<AssetSnapshot>) {
  await gas.updateRow("AssetSnapshots", id, data);
  revalidateAll();
}

export async function removeAssetSnapshot(id: string) {
  await gas.deleteRow("AssetSnapshots", id);
  revalidateAll();
}

// ---- Asset accounts --------------------------------------------------

export async function addAssetAccount(data: AssetAccount) {
  await gas.createRow("AssetAccounts", data);
  revalidateAll();
}

export async function removeAssetAccount(id: string) {
  await gas.deleteRow("AssetAccounts", id);
  revalidateAll();
}

// ---- Members ------------------------------------------------------------

export async function addMember(data: Member) {
  await gas.createRow("Members", data);
  revalidateAll();
}

export async function removeMember(id: string) {
  await gas.deleteRow("Members", id);
  revalidateAll();
}

// ---- Categories -----------------------------------------------------------

export async function addCategory(data: Category) {
  await gas.createRow("Categories", data);
  revalidateAll();
}

export async function removeCategory(id: string) {
  await gas.deleteRow("Categories", id);
  revalidateAll();
}

// ---- 横断検索 --------------------------------------------------------

export type SearchResults = {
  transactions: {
    id: string;
    date: string;
    amount: number;
    type: "income" | "expense";
    categoryName: string;
    memo?: string;
  }[];
  events: {
    id: string;
    title: string;
    startDate: string;
    memberName?: string;
  }[];
  snapshots: {
    id: string;
    accountId: string;
    accountName: string;
    currency?: CurrencyCode;
    date: string;
    value: number;
    note?: string;
  }[];
  /** 各カテゴリの一致件数（表示件数を limit 件に絞る前の総数）。「他◯件」の表示に使う。 */
  totalCounts: {
    transactions: number;
    events: number;
    snapshots: number;
  };
};

/** limit未指定時は8件（ヘッダーのプレビュー用）。/search の全件表示では大きい値を渡す。 */
export async function searchAll(query: string, limit = 8): Promise<SearchResults> {
  const q = query.trim().toLowerCase();
  if (!q) {
    return { transactions: [], events: [], snapshots: [], totalCounts: { transactions: 0, events: 0, snapshots: 0 } };
  }

  const [transactions, events, snapshots, categories, members, accounts] = await Promise.all([
    gas.getTransactions(),
    gas.getEvents(),
    gas.getAssetSnapshots(),
    gas.getCategories(),
    gas.getMembers(),
    gas.getAssetAccounts(),
  ]);

  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? "その他";
  const memberName = (id?: string) => members.find((m) => m.id === id)?.name;
  const accountById = (id: string) => accounts.find((a) => a.id === id);
  const accountName = (id: string) => accountById(id)?.name ?? "不明な口座";

  const allMatchedTransactions = transactions
    .filter(
      (t) =>
        (t.memo ?? "").toLowerCase().includes(q) ||
        categoryName(t.categoryId).toLowerCase().includes(q)
    )
    .sort((a, b) => b.date.localeCompare(a.date));

  const allMatchedEvents = events
    .filter(
      (e) => e.title.toLowerCase().includes(q) || (e.memo ?? "").toLowerCase().includes(q)
    )
    .sort((a, b) => b.startDate.localeCompare(a.startDate));

  const allMatchedSnapshots = snapshots
    .filter(
      (s) =>
        (s.note ?? "").toLowerCase().includes(q) ||
        accountName(s.assetAccountId).toLowerCase().includes(q)
    )
    .sort((a, b) => b.date.localeCompare(a.date));

  const matchedTransactions = allMatchedTransactions.slice(0, limit).map((t) => ({
    id: t.id,
    date: t.date,
    amount: t.amount,
    type: t.type,
    categoryName: categoryName(t.categoryId),
    memo: t.memo,
  }));

  const matchedEvents = allMatchedEvents.slice(0, limit).map((e) => ({
    id: e.id,
    title: e.title,
    startDate: e.startDate,
    memberName: memberName(e.memberId),
  }));

  const matchedSnapshots = allMatchedSnapshots.slice(0, limit).map((s) => ({
    id: s.id,
    accountId: s.assetAccountId,
    accountName: accountName(s.assetAccountId),
    currency: accountById(s.assetAccountId)?.currency,
    date: s.date,
    value: s.value,
    note: s.note,
  }));

  return {
    transactions: matchedTransactions,
    events: matchedEvents,
    snapshots: matchedSnapshots,
    totalCounts: {
      transactions: allMatchedTransactions.length,
      events: allMatchedEvents.length,
      snapshots: allMatchedSnapshots.length,
    },
  };
}
