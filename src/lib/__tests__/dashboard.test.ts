import { describe, expect, it } from "vitest";
import {
  monthlySummary,
  recentTransactions,
  shiftMonthStr,
  totalAssetsAsOf,
  upcomingEvents,
} from "../dashboard";
import type { AssetAccount, AssetSnapshot, ScheduleEvent, Transaction } from "../types";

describe("monthlySummary", () => {
  it("指定した月の収入・支出・差引を集計する", () => {
    const transactions: Transaction[] = [
      { id: "t1", date: "2026-08-01", amount: 1000, type: "income", categoryId: "c1" },
      { id: "t2", date: "2026-08-15", amount: 300, type: "expense", categoryId: "c2" },
      { id: "t3", date: "2026-07-31", amount: 5000, type: "income", categoryId: "c1" },
    ];
    expect(monthlySummary(transactions, "2026-08")).toEqual({
      income: 1000,
      expense: 300,
      balance: 700,
    });
  });
});

describe("upcomingEvents", () => {
  it("終了日が今日以降の予定を開始日順に返す", () => {
    const events: ScheduleEvent[] = [
      { id: "e1", title: "A", startDate: "2026-08-20", endDate: "2026-08-20", memberId: "m1" },
      { id: "e2", title: "B", startDate: "2026-08-10", endDate: "2026-08-10", memberId: "m1" },
      { id: "e3", title: "過去", startDate: "2026-08-01", endDate: "2026-08-01", memberId: "m1" },
    ];
    const result = upcomingEvents(events, "2026-08-05");
    expect(result.map((e) => e.id)).toEqual(["e2", "e1"]);
  });

  it("limitで件数を絞れる", () => {
    const events: ScheduleEvent[] = Array.from({ length: 6 }, (_, i) => ({
      id: `e${i}`,
      title: `event${i}`,
      startDate: `2026-08-${10 + i}`,
      endDate: `2026-08-${10 + i}`,
      memberId: "m1",
    }));
    expect(upcomingEvents(events, "2026-08-01", 2)).toHaveLength(2);
  });
});

describe("recentTransactions", () => {
  it("日付が新しい順にlimit件返す", () => {
    const transactions: Transaction[] = [
      { id: "t1", date: "2026-08-01", amount: 100, type: "expense", categoryId: "c1" },
      { id: "t2", date: "2026-08-15", amount: 200, type: "income", categoryId: "c1" },
      { id: "t3", date: "2026-08-10", amount: 300, type: "expense", categoryId: "c1" },
    ];
    expect(recentTransactions(transactions, 2).map((t) => t.id)).toEqual(["t2", "t3"]);
  });

  it("既定のlimitは3件", () => {
    const transactions: Transaction[] = Array.from({ length: 5 }, (_, i) => ({
      id: `t${i}`,
      date: `2026-08-${10 + i}`,
      amount: 100,
      type: "expense" as const,
      categoryId: "c1",
    }));
    expect(recentTransactions(transactions)).toHaveLength(3);
  });
});

describe("totalAssetsAsOf", () => {
  const accounts: AssetAccount[] = [
    { id: "a1", name: "口座1", type: "bank" },
    { id: "a2", name: "口座2", type: "cash" },
  ];
  const snapshots: AssetSnapshot[] = [
    { id: "s1", assetAccountId: "a1", date: "2026-07-01", value: 100000 },
    { id: "s2", assetAccountId: "a1", date: "2026-08-01", value: 120000 },
    { id: "s3", assetAccountId: "a2", date: "2026-07-15", value: 50000 },
  ];

  it("指定日時点で各口座の最新スナップショットを合計する", () => {
    expect(totalAssetsAsOf(accounts, snapshots, "2026-08-31")).toBe(170000);
  });

  it("指定日より後のスナップショットは含めない（先月比などの過去断面用）", () => {
    expect(totalAssetsAsOf(accounts, snapshots, "2026-07-31")).toBe(150000);
  });

  it("スナップショットが1件もない口座はカウントしない", () => {
    expect(totalAssetsAsOf(accounts, snapshots, "2026-06-30")).toBe(0);
  });
});

describe("shiftMonthStr", () => {
  it("月をまたいでずらせる", () => {
    expect(shiftMonthStr("2026-08", -1)).toBe("2026-07");
    expect(shiftMonthStr("2026-08", 1)).toBe("2026-09");
  });

  it("年をまたぐ場合も正しく計算する", () => {
    expect(shiftMonthStr("2026-01", -1)).toBe("2025-12");
    expect(shiftMonthStr("2026-12", 1)).toBe("2027-01");
  });
});
