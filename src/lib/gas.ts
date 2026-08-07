import "server-only";
import type {
  AssetAccount,
  AssetSnapshot,
  Category,
  Member,
  ScheduleEvent,
  Transaction,
} from "./types";

const GAS_URL = process.env.GAS_API_URL;

type SheetName =
  | "Members"
  | "Categories"
  | "Transactions"
  | "Events"
  | "AssetAccounts"
  | "AssetSnapshots";

function requireUrl(): string {
  if (!GAS_URL) {
    throw new Error(
      "GAS_API_URL が設定されていません。.env.local を確認してください。"
    );
  }
  return GAS_URL;
}

async function gasGet<T>(sheet: SheetName): Promise<T[]> {
  const res = await fetch(`${requireUrl()}?sheet=${sheet}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`GAS GET ${sheet} failed: ${res.status}`);
  return res.json();
}

async function gasPost(body: Record<string, unknown>): Promise<void> {
  const res = await fetch(requireUrl(), {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`GAS POST failed: ${res.status}`);
  const json = await res.json();
  if (json?.error) throw new Error(String(json.error));
}

function emptyToUndefined(value: string | undefined | null): string | undefined {
  return value ? value : undefined;
}

export async function getMembers(): Promise<Member[]> {
  return gasGet<Member>("Members");
}

export async function getCategories(): Promise<Category[]> {
  return gasGet<Category>("Categories");
}

export async function getTransactions(): Promise<Transaction[]> {
  const rows = await gasGet<Transaction>("Transactions");
  return rows.map((r) => ({ ...r, memo: emptyToUndefined(r.memo) }));
}

export async function getEvents(): Promise<ScheduleEvent[]> {
  const rows = await gasGet<ScheduleEvent>("Events");
  return rows.map((r) => ({
    ...r,
    startTime: emptyToUndefined(r.startTime),
    endTime: emptyToUndefined(r.endTime),
    memo: emptyToUndefined(r.memo),
  }));
}

export async function getAssetAccounts(): Promise<AssetAccount[]> {
  const rows = await gasGet<AssetAccount>("AssetAccounts");
  return rows.map((r) => ({ ...r, memberId: emptyToUndefined(r.memberId) }));
}

export async function getAssetSnapshots(): Promise<AssetSnapshot[]> {
  const rows = await gasGet<AssetSnapshot>("AssetSnapshots");
  return rows.map((r) => ({ ...r, note: emptyToUndefined(r.note) }));
}

export async function createRow(
  sheet: SheetName,
  data: Record<string, unknown>
): Promise<void> {
  await gasPost({ sheet, action: "create", data });
}

export async function updateRow(
  sheet: SheetName,
  id: string,
  data: Record<string, unknown>
): Promise<void> {
  await gasPost({ sheet, action: "update", id, data });
}

export async function deleteRow(sheet: SheetName, id: string): Promise<void> {
  await gasPost({ sheet, action: "delete", id });
}
