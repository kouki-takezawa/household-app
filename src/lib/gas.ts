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
      "GAS_API_URL が設定されていません。.env.local（本番はVercelの環境変数）を確認してください。"
    );
  }
  return GAS_URL;
}

// GASはコールドスタート時に数秒〜十数秒かかることがあるため、Vercelの
// サーバーアクションのタイムアウトより先にこちら側で打ち切り、原因を
// 「タイムアウト」だと特定できるようにする。
const GAS_TIMEOUT_MS = 25_000;

async function gasFetch(url: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(url, { ...init, signal: AbortSignal.timeout(GAS_TIMEOUT_MS) });
  } catch (err) {
    if (err instanceof Error && err.name === "TimeoutError") {
      throw new Error(
        "GASサーバーからの応答がタイムアウトしました。GASのWebアプリが正しくデプロイされているか確認してください。"
      );
    }
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(
      `GASサーバーに接続できませんでした（${detail}）。GAS_API_URLの値とGASのデプロイ状態を確認してください。`
    );
  }
}

// GASの応答は遅い（数秒）ため、短時間キャッシュして画面遷移を高速化する。
// 追加・編集・削除のたびに actions.ts の revalidatePath が全ページのキャッシュを
// 破棄するので、データが古いまま表示され続けることはない。
async function gasGet<T>(sheet: SheetName): Promise<T[]> {
  const res = await gasFetch(`${requireUrl()}?sheet=${sheet}`, {
    next: { revalidate: 30 },
  });
  if (!res.ok) {
    throw new Error(`GASサーバーがエラーを返しました（GET ${sheet}: ${res.status}）。`);
  }
  return res.json();
}

async function gasPost(body: Record<string, unknown>): Promise<void> {
  const res = await gasFetch(requireUrl(), {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`GASサーバーがエラーを返しました（POST: ${res.status}）。`);
  }
  let json: { error?: unknown } | null = null;
  try {
    json = await res.json();
  } catch {
    // GASのWebアプリ権限が「全員」になっていない等の理由でJSONの代わりに
    // Googleのログイン/権限エラーページ（HTML）が返ってくるケースがある。
    throw new Error(
      "GASサーバーの応答を解析できませんでした。GASのデプロイ設定（アクセスできるユーザー）を確認してください。"
    );
  }
  if (json?.error) throw new Error(`GASサーバーエラー: ${String(json.error)}`);
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
  return rows.map((r) => ({
    ...r,
    memberId: emptyToUndefined(r.memberId),
    memo: emptyToUndefined(r.memo),
  }));
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
