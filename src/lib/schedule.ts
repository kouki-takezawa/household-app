import { differenceInCalendarDays, getDate, parseISO, startOfDay } from "date-fns";
import type { ScheduleEvent } from "./types";

/** ある日付にその予定が発生するかどうかを判定する（繰り返し設定を考慮） */
export function eventOccursOn(event: ScheduleEvent, date: Date): boolean {
  const start = startOfDay(parseISO(event.startDate));
  const end = startOfDay(parseISO(event.endDate));
  const day = startOfDay(date);
  const durationDays = differenceInCalendarDays(end, start);

  if (day < start) return false;

  switch (event.recurrence) {
    case "weekly": {
      const offsetInCycle = differenceInCalendarDays(day, start) % 7;
      return offsetInCycle <= durationDays;
    }
    case "monthly": {
      const occStart = startOfDay(new Date(day.getFullYear(), day.getMonth(), getDate(start)));
      const anchor =
        occStart > day
          ? startOfDay(new Date(day.getFullYear(), day.getMonth() - 1, getDate(start)))
          : occStart;
      if (anchor < start) return false;
      const offset = differenceInCalendarDays(day, anchor);
      return offset >= 0 && offset <= durationDays;
    }
    default:
      return day <= end;
  }
}
