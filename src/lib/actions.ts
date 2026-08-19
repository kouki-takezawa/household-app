"use server";

import { revalidatePath } from "next/cache";
import * as gas from "./gas";
import type {
  AssetAccount,
  AssetSnapshot,
  Category,
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
    date: string;
    value: number;
    note?: string;
  }[];
};

export async function searchAll(query: string): Promise<SearchResults> {
  const q = query.trim().toLowerCase();
  if (!q) return { transactions: [], events: [], snapshots: [] };

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
  const accountName = (id: string) => accounts.find((a) => a.id === id)?.name ?? "不明な口座";

  const matchedTransactions = transactions
    .filter(
      (t) =>
        (t.memo ?? "").toLowerCase().includes(q) ||
        categoryName(t.categoryId).toLowerCase().includes(q)
    )
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8)
    .map((t) => ({
      id: t.id,
      date: t.date,
      amount: t.amount,
      type: t.type,
      categoryName: categoryName(t.categoryId),
      memo: t.memo,
    }));

  const matchedEvents = events
    .filter(
      (e) => e.title.toLowerCase().includes(q) || (e.memo ?? "").toLowerCase().includes(q)
    )
    .sort((a, b) => b.startDate.localeCompare(a.startDate))
    .slice(0, 8)
    .map((e) => ({
      id: e.id,
      title: e.title,
      startDate: e.startDate,
      memberName: memberName(e.memberId),
    }));

  const matchedSnapshots = snapshots
    .filter(
      (s) =>
        (s.note ?? "").toLowerCase().includes(q) ||
        accountName(s.assetAccountId).toLowerCase().includes(q)
    )
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8)
    .map((s) => ({
      id: s.id,
      accountId: s.assetAccountId,
      accountName: accountName(s.assetAccountId),
      date: s.date,
      value: s.value,
      note: s.note,
    }));

  return { transactions: matchedTransactions, events: matchedEvents, snapshots: matchedSnapshots };
}
