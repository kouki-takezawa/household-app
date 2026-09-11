export type Member = {
  id: string;
  name: string;
  color: string;
};

export type Category = {
  id: string;
  name: string;
  type: "income" | "expense";
  color: string;
};

export type Transaction = {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  type: "income" | "expense";
  categoryId: string;
  memberId?: string; // 記録者（未設定の記録は表示上「不明」扱い）
  memo?: string;
};

export type ScheduleEvent = {
  id: string;
  title: string;
  startDate: string; // YYYY-MM-DD
  startTime?: string;
  endDate: string; // YYYY-MM-DD（単日の予定は startDate と同じ）
  endTime?: string;
  memberId: string;
  recurrence?: "none" | "weekly" | "monthly";
  memo?: string;
};

/** 未設定（undefined）は円（JPY）として扱う */
export type CurrencyCode = "JPY" | "USD" | "EUR";

export const CURRENCY_LABEL: Record<CurrencyCode, string> = {
  JPY: "円",
  USD: "米ドル",
  EUR: "ユーロ",
};

export const CURRENCY_SYMBOL: Record<CurrencyCode, string> = {
  JPY: "¥",
  USD: "$",
  EUR: "€",
};

export type AssetAccount = {
  id: string;
  name: string;
  type: "cash" | "bank" | "investment";
  memberId?: string;
  /** 口座の通貨。未設定はJPY（既存データとの後方互換のため） */
  currency?: CurrencyCode;
};

export const ASSET_TYPE_LABEL: Record<AssetAccount["type"], string> = {
  cash: "現金",
  bank: "銀行預金",
  investment: "投資信託・株式等",
};

export const ASSET_TYPE_COLOR: Record<AssetAccount["type"], string> = {
  cash: "#f59e0b",
  bank: "#3b82f6",
  investment: "#10b981",
};

export type AssetSnapshot = {
  id: string;
  assetAccountId: string;
  date: string; // YYYY-MM-DD
  /** 口座の通貨建ての残高・評価額（外貨口座ならその通貨の金額） */
  value: number;
  note?: string;
  /** この時点までの元本（取得額）合計。投資口座の含み損益計算に使う。value と同じ通貨建て */
  costBasis?: number;
  /** 記録時点の為替レート（1外貨 = ?円）。口座が外貨建てのときのみ使う */
  fxRate?: number;
};

/** 口座の通貨に関わらず、円換算した金額を返す（複数口座の合計・グラフ集計用） */
export function jpyValue(snapshot: AssetSnapshot, account: AssetAccount): number {
  if (!account.currency || account.currency === "JPY") return snapshot.value;
  return snapshot.value * (snapshot.fxRate ?? 1);
}

/** 含み損益（value - costBasis）。costBasis未記録の場合は undefined */
export function unrealizedGain(snapshot: AssetSnapshot): number | undefined {
  if (snapshot.costBasis === undefined) return undefined;
  return snapshot.value - snapshot.costBasis;
}

/** 含み損益率（%）。costBasisが0または未記録の場合は undefined */
export function unrealizedGainPercent(snapshot: AssetSnapshot): number | undefined {
  if (!snapshot.costBasis) return undefined;
  return ((snapshot.value - snapshot.costBasis) / snapshot.costBasis) * 100;
}

export function formatCurrency(amount: number, currency: CurrencyCode = "JPY"): string {
  if (currency === "JPY") return formatYen(amount);
  return `${CURRENCY_SYMBOL[currency]}${amount.toLocaleString("en-US")}`;
}

const JST_DATE_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** 実行環境のタイムゾーンに関わらず、日本時間での「今日」を YYYY-MM-DD で返す */
export function todayStr(): string {
  return JST_DATE_FORMATTER.format(new Date());
}

export function findMemberById(
  members: Member[],
  id: string | undefined
): Member | undefined {
  return members.find((m) => m.id === id);
}

export function findCategoryById(categories: Category[], id: string): Category | undefined {
  return categories.find((c) => c.id === id);
}

export function formatYen(amount: number): string {
  return `¥${amount.toLocaleString("ja-JP")}`;
}

export function isMultiDayEvent(event: ScheduleEvent): boolean {
  return event.startDate !== event.endDate;
}

export function formatEventSchedule(event: ScheduleEvent): string {
  const dateRange = isMultiDayEvent(event)
    ? `${event.startDate} 〜 ${event.endDate}`
    : event.startDate;
  const timeRange =
    event.startTime && event.endTime
      ? `${event.startTime}〜${event.endTime}`
      : event.startTime || "終日";
  return `${dateRange} ${timeRange}`;
}
