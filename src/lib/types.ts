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

export type AssetAccount = {
  id: string;
  name: string;
  type: "cash" | "bank" | "investment";
  memberId?: string;
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
  value: number;
  note?: string;
};

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

export function findMemberById(members: Member[], id: string): Member | undefined {
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
