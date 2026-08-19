import { describe, expect, it } from "vitest";
import { eventOccursOn } from "../schedule";
import type { ScheduleEvent } from "../types";

function baseEvent(overrides: Partial<ScheduleEvent> = {}): ScheduleEvent {
  return {
    id: "e1",
    title: "テスト予定",
    startDate: "2026-08-01",
    endDate: "2026-08-01",
    memberId: "m1",
    recurrence: "none",
    ...overrides,
  };
}

describe("eventOccursOn", () => {
  it("繰り返しなしの単日予定は開始日のみ発生する", () => {
    const event = baseEvent();
    expect(eventOccursOn(event, new Date(2026, 7, 1))).toBe(true);
    expect(eventOccursOn(event, new Date(2026, 7, 2))).toBe(false);
  });

  it("開始日より前には発生しない", () => {
    const event = baseEvent({ startDate: "2026-08-10", endDate: "2026-08-10" });
    expect(eventOccursOn(event, new Date(2026, 7, 9))).toBe(false);
  });

  it("複数日にまたがる予定はその期間ずっと発生する", () => {
    const event = baseEvent({ startDate: "2026-08-01", endDate: "2026-08-03" });
    expect(eventOccursOn(event, new Date(2026, 7, 1))).toBe(true);
    expect(eventOccursOn(event, new Date(2026, 7, 2))).toBe(true);
    expect(eventOccursOn(event, new Date(2026, 7, 3))).toBe(true);
    expect(eventOccursOn(event, new Date(2026, 7, 4))).toBe(false);
  });

  it("毎週の繰り返しは7日ごとに発生する", () => {
    const event = baseEvent({
      startDate: "2026-08-01",
      endDate: "2026-08-01",
      recurrence: "weekly",
    });
    expect(eventOccursOn(event, new Date(2026, 7, 1))).toBe(true);
    expect(eventOccursOn(event, new Date(2026, 7, 8))).toBe(true);
    expect(eventOccursOn(event, new Date(2026, 7, 15))).toBe(true);
    expect(eventOccursOn(event, new Date(2026, 7, 5))).toBe(false);
  });

  it("毎月の繰り返しは同じ日に毎月発生する", () => {
    const event = baseEvent({
      startDate: "2026-01-15",
      endDate: "2026-01-15",
      recurrence: "monthly",
    });
    expect(eventOccursOn(event, new Date(2026, 0, 15))).toBe(true);
    expect(eventOccursOn(event, new Date(2026, 1, 15))).toBe(true);
    expect(eventOccursOn(event, new Date(2026, 7, 15))).toBe(true);
    expect(eventOccursOn(event, new Date(2026, 1, 16))).toBe(false);
  });

  it("毎月の繰り返しは開始月より前には発生しない", () => {
    const event = baseEvent({
      startDate: "2026-06-15",
      endDate: "2026-06-15",
      recurrence: "monthly",
    });
    expect(eventOccursOn(event, new Date(2026, 4, 15))).toBe(false);
  });
});
