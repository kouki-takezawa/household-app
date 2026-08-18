"use client";

import { useMemo, useState } from "react";
import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getDate,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ja } from "date-fns/locale";
import clsx from "clsx";
import PageHeader from "@/components/PageHeader";
import {
  type Member,
  type ScheduleEvent,
  findMemberById,
  formatEventSchedule,
  todayStr,
} from "@/lib/types";
import { addEvent, editEvent, removeEvent } from "@/lib/actions";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

function eventOccursOn(event: ScheduleEvent, date: Date): boolean {
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
      const anchor = occStart > day
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

function emptyForm(dateStr: string, members: Member[]) {
  return {
    title: "",
    startDate: dateStr,
    startTime: "",
    endDate: dateStr,
    endTime: "",
    memberId: members[0]?.id ?? "",
    recurrence: "none" as ScheduleEvent["recurrence"],
    memo: "",
  };
}

export default function ScheduleClient({
  members,
  initialEvents,
}: {
  members: Member[];
  initialEvents: ScheduleEvent[];
}) {
  const TODAY = useMemo(() => parseISO(todayStr()), []);

  const [events, setEvents] = useState<ScheduleEvent[]>(initialEvents);
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [cursor, setCursor] = useState(TODAY);
  const [selectedDate, setSelectedDate] = useState(TODAY);
  const [memberFilter, setMemberFilter] = useState<Set<string>>(
    new Set(members.map((m) => m.id))
  );
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => emptyForm(format(TODAY, "yyyy-MM-dd"), members));

  const visibleEvents = useMemo(
    () => events.filter((e) => memberFilter.has(e.memberId)),
    [events, memberFilter]
  );

  const days = useMemo(() => {
    if (viewMode === "month") {
      const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 0 });
      const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 0 });
      return eachDayOfInterval({ start, end });
    }
    const start = startOfWeek(selectedDate, { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end: addDays(start, 6) });
  }, [viewMode, cursor, selectedDate]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, ScheduleEvent[]>();
    for (const day of days) {
      const key = format(day, "yyyy-MM-dd");
      map.set(
        key,
        visibleEvents
          .filter((e) => eventOccursOn(e, day))
          .sort((a, b) => (a.startTime ?? "").localeCompare(b.startTime ?? ""))
      );
    }
    return map;
  }, [days, visibleEvents]);

  function toggleMember(id: string) {
    setMemberFilter((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function openNewForm(date: Date) {
    setEditingId(null);
    setForm(emptyForm(format(date, "yyyy-MM-dd"), members));
    setShowForm(true);
  }

  function openEditForm(event: ScheduleEvent) {
    setEditingId(event.id);
    setForm({
      title: event.title,
      startDate: event.startDate,
      startTime: event.startTime ?? "",
      endDate: event.endDate,
      endTime: event.endTime ?? "",
      memberId: event.memberId,
      recurrence: event.recurrence ?? "none",
      memo: event.memo ?? "",
    });
    setShowForm(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("この予定を削除しますか？")) return;
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setShowForm(false);
    await removeEvent(id);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    const endDate = form.endDate < form.startDate ? form.startDate : form.endDate;
    setSaving(true);

    if (editingId) {
      const updated: ScheduleEvent = {
        id: editingId,
        title: form.title,
        startDate: form.startDate,
        startTime: form.startTime || undefined,
        endDate,
        endTime: form.endTime || undefined,
        memberId: form.memberId,
        recurrence: form.recurrence,
        memo: form.memo || undefined,
      };
      setEvents((prev) => prev.map((ev) => (ev.id === editingId ? updated : ev)));
      await editEvent(editingId, updated);
    } else {
      const newEvent: ScheduleEvent = {
        id: `e${Date.now()}`,
        title: form.title,
        startDate: form.startDate,
        startTime: form.startTime || undefined,
        endDate,
        endTime: form.endTime || undefined,
        memberId: form.memberId,
        recurrence: form.recurrence,
        memo: form.memo || undefined,
      };
      setEvents((prev) => [...prev, newEvent]);
      await addEvent(newEvent);
    }
    setSaving(false);
    setShowForm(false);
  }

  const selectedKey = format(selectedDate, "yyyy-MM-dd");
  const selectedDayEvents = eventsByDay.get(selectedKey) ?? [];

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="日程表" />

      <section className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() =>
              viewMode === "month"
                ? setCursor((c) => subMonths(c, 1))
                : setSelectedDate((d) => addDays(d, -7))
            }
            className="flex h-9 w-9 items-center justify-center rounded-full text-amber-700 active:bg-slate-100"
          >
            ‹
          </button>
          <p className="w-28 text-center text-[15px] font-semibold text-slate-900">
            {format(viewMode === "month" ? cursor : selectedDate, "yyyy年M月", { locale: ja })}
          </p>
          <button
            type="button"
            onClick={() =>
              viewMode === "month"
                ? setCursor((c) => addMonths(c, 1))
                : setSelectedDate((d) => addDays(d, 7))
            }
            className="flex h-9 w-9 items-center justify-center rounded-full text-amber-700 active:bg-slate-100"
          >
            ›
          </button>
        </div>
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1 text-[13px]">
          <button
            type="button"
            onClick={() => setViewMode("month")}
            className={clsx(
              "rounded-lg px-3 py-1.5 font-semibold transition-colors",
              viewMode === "month" ? "bg-white text-amber-700 shadow-sm" : "text-slate-500"
            )}
          >
            月
          </button>
          <button
            type="button"
            onClick={() => setViewMode("week")}
            className={clsx(
              "rounded-lg px-3 py-1.5 font-semibold transition-colors",
              viewMode === "week" ? "bg-white text-amber-700 shadow-sm" : "text-slate-500"
            )}
          >
            週
          </button>
        </div>
      </section>

      <section className="flex flex-wrap gap-2">
        {members.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => toggleMember(m.id)}
            className={clsx(
              "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-opacity",
              memberFilter.has(m.id) ? "border-slate-200 bg-white" : "border-slate-100 opacity-40"
            )}
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: m.color }} />
            {m.name}
          </button>
        ))}
      </section>

      <section className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-900/5">
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-slate-400">
          {WEEKDAYS.map((w) => (
            <div key={w} className="py-1">
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const dayEvents = eventsByDay.get(key) ?? [];
            const inMonth = viewMode === "week" || isSameMonth(day, cursor);
            const selected = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, TODAY);
            return (
              <button
                type="button"
                key={key}
                onClick={() => setSelectedDate(day)}
                className={clsx(
                  "flex min-h-[3.4rem] flex-col items-center rounded-xl p-1 text-xs transition-colors",
                  selected ? "bg-amber-50 ring-1 ring-amber-400" : "active:bg-slate-50",
                  !inMonth && "opacity-30"
                )}
              >
                <span
                  className={clsx(
                    "flex h-6 w-6 items-center justify-center rounded-full text-[13px]",
                    isToday && "bg-amber-600 text-white font-semibold"
                  )}
                >
                  {format(day, "d")}
                </span>
                <div className="mt-1 flex flex-wrap justify-center gap-0.5">
                  {dayEvents.slice(0, 4).map((ev) => (
                    <span
                      key={ev.id}
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: findMemberById(members, ev.memberId)?.color }}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between px-1">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-slate-400">
            {format(selectedDate, "M月d日(E)", { locale: ja })}の予定
          </h2>
          <button
            type="button"
            onClick={() => openNewForm(selectedDate)}
            className="rounded-full bg-amber-600 px-3.5 py-1.5 text-[13px] font-semibold text-white shadow-sm shadow-amber-600/30 transition-transform active:scale-95"
          >
            ＋ 予定を追加
          </button>
        </div>
        <div className="divide-y divide-slate-100 rounded-2xl bg-white shadow-sm ring-1 ring-slate-900/5">
          {selectedDayEvents.length === 0 && (
            <p className="p-4 text-[13px] text-slate-400">予定はありません</p>
          )}
          {selectedDayEvents.map((event) => {
            const member = findMemberById(members, event.memberId);
            return (
              <button
                type="button"
                key={event.id}
                onClick={() => openEditForm(event)}
                className="flex w-full items-center gap-3 p-3.5 text-left active:bg-slate-50"
              >
                <span
                  className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: member?.color }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium text-slate-800">{event.title}</p>
                  <p className="text-[12px] text-slate-400">
                    {formatEventSchedule(event)} ・ {member?.name}
                    {event.recurrence && event.recurrence !== "none"
                      ? ` ・ ${event.recurrence === "weekly" ? "毎週" : "毎月"}`
                      : ""}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-sm rounded-t-3xl bg-white px-5 pt-3 shadow-xl sm:rounded-3xl sm:pt-5"
            style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
          >
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-300 sm:hidden" />
            <h3 className="mb-4 text-[17px] font-bold text-slate-900">
              {editingId ? "予定を編集" : "予定を追加"}
            </h3>
            <div className="flex flex-col gap-3">
              <label className="text-[12px] text-slate-400">
                タイトル
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[16px] focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  placeholder="例: 家族会議"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="text-[12px] text-slate-400">
                  開始日
                  <input
                    type="date"
                    required
                    value={form.startDate}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        startDate: e.target.value,
                        endDate: f.endDate < e.target.value ? e.target.value : f.endDate,
                      }))
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[16px] focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </label>
                <label className="text-[12px] text-slate-400">
                  開始時刻（任意）
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[16px] focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="text-[12px] text-slate-400">
                  終了日
                  <input
                    type="date"
                    required
                    min={form.startDate}
                    value={form.endDate}
                    onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[16px] focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </label>
                <label className="text-[12px] text-slate-400">
                  終了時刻（任意）
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[16px] focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </label>
              </div>
              <p className="-mt-1 text-[11px] text-slate-400">
                終了日を開始日より後にすると、その期間すべての日にこの予定が表示されます。
              </p>

              <label className="text-[12px] text-slate-400">
                メンバー
                <select
                  value={form.memberId}
                  onChange={(e) => setForm((f) => ({ ...f, memberId: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[16px] focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-[12px] text-slate-400">
                繰り返し
                <select
                  value={form.recurrence}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      recurrence: e.target.value as ScheduleEvent["recurrence"],
                    }))
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[16px] focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                >
                  <option value="none">なし</option>
                  <option value="weekly">毎週</option>
                  <option value="monthly">毎月</option>
                </select>
              </label>
              <label className="text-[12px] text-slate-400">
                メモ
                <input
                  type="text"
                  value={form.memo}
                  onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[16px] focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  placeholder="任意"
                />
              </label>
            </div>

            <div className="mt-5 flex gap-2">
              {editingId && (
                <button
                  type="button"
                  onClick={() => handleDelete(editingId)}
                  className="rounded-full border border-rose-200 px-4 py-3 text-[15px] font-semibold text-rose-500 active:bg-rose-50"
                >
                  削除
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 rounded-full border border-slate-200 py-3 text-[15px] font-semibold text-slate-600 active:bg-slate-50"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-full bg-amber-600 py-3 text-[15px] font-semibold text-white shadow-sm shadow-amber-600/30 transition-transform active:scale-[0.98] disabled:opacity-60"
              >
                {saving ? "保存中…" : "保存"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
