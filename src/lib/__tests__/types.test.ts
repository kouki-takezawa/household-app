import { describe, expect, it } from "vitest";
import { formatEventSchedule, formatYen, isMultiDayEvent } from "../types";
import type { ScheduleEvent } from "../types";

describe("formatYen", () => {
  it("3桁区切りで円マークを付ける", () => {
    expect(formatYen(1234567)).toBe("¥1,234,567");
  });

  it("0円も正しく表示する", () => {
    expect(formatYen(0)).toBe("¥0");
  });
});

describe("isMultiDayEvent / formatEventSchedule", () => {
  it("単日イベントは複数日と判定しない", () => {
    const event: ScheduleEvent = {
      id: "e1",
      title: "会議",
      startDate: "2026-08-01",
      endDate: "2026-08-01",
      memberId: "m1",
    };
    expect(isMultiDayEvent(event)).toBe(false);
    expect(formatEventSchedule(event)).toBe("2026-08-01 終日");
  });

  it("時刻がある場合は時刻範囲を表示する", () => {
    const event: ScheduleEvent = {
      id: "e2",
      title: "会議",
      startDate: "2026-08-01",
      endDate: "2026-08-01",
      startTime: "10:00",
      endTime: "11:00",
      memberId: "m1",
    };
    expect(formatEventSchedule(event)).toBe("2026-08-01 10:00〜11:00");
  });

  it("複数日イベントは日付範囲を表示する", () => {
    const event: ScheduleEvent = {
      id: "e3",
      title: "旅行",
      startDate: "2026-08-01",
      endDate: "2026-08-03",
      memberId: "m1",
    };
    expect(isMultiDayEvent(event)).toBe(true);
    expect(formatEventSchedule(event)).toBe("2026-08-01 〜 2026-08-03 終日");
  });
});
