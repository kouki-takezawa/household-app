"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ja } from "date-fns/locale";
import clsx from "clsx";
import {
  type Member,
  type ScheduleEvent,
  findMemberById,
  formatEventSchedule,
  todayStr,
} from "@/lib/types";
import { eventOccursOn } from "@/lib/schedule";
import { addEvent } from "@/lib/actions";
import { ColorAvatar } from "@/components/ColorAvatar";
import { EmptyState } from "@/components/EmptyState";
import { BottomSheet, SheetActions } from "@/components/BottomSheet";
import { MemberFilterChips } from "@/components/MemberFilterChips";
import { useToast } from "@/components/Toast";
import { fieldClass, FieldError } from "@/components/form";
import { generateId } from "@/lib/id";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

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
  const showToast = useToast();

  const [events, setEvents] = useState<ScheduleEvent[]>(initialEvents);
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [cursor, setCursor] = useState(TODAY);
  const [selectedDate, setSelectedDate] = useState(TODAY);
  const [memberFilter, setMemberFilter] = useState<Set<string>>(
    new Set(members.map((m) => m.id))
  );
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => emptyForm(format(TODAY, "yyyy-MM-dd"), members));
  const [titleError, setTitleError] = useState<string | null>(null);

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
    setForm(emptyForm(format(date, "yyyy-MM-dd"), members));
    setTitleError(null);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      setTitleError("タイトルを入力してください");
      return;
    }
    setTitleError(null);
    const endDate = form.endDate < form.startDate ? form.startDate : form.endDate;
    setSaving(true);

    const newEvent: ScheduleEvent = {
      id: generateId("e"),
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
    try {
      await addEvent(newEvent);
      showToast("予定を追加しました");
      setShowForm(false);
    } catch {
      setEvents((prev) => prev.filter((ev) => ev.id !== newEvent.id));
      showToast("追加に失敗しました。もう一度お試しください", { variant: "error" });
    }
    setSaving(false);
  }

  const selectedKey = format(selectedDate, "yyyy-MM-dd");
  const selectedDayEvents = eventsByDay.get(selectedKey) ?? [];

  return (
    <div className="flex flex-col gap-4">
      <section className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() =>
              viewMode === "month"
                ? setCursor((c) => subMonths(c, 1))
                : setSelectedDate((d) => addDays(d, -7))
            }
            className="flex h-9 w-9 items-center justify-center rounded-full text-brand active:bg-track"
          >
            ‹
          </button>
          <p className="w-28 text-center text-[15px] font-semibold text-foreground">
            {format(viewMode === "month" ? cursor : selectedDate, "yyyy年M月", { locale: ja })}
          </p>
          <button
            type="button"
            onClick={() =>
              viewMode === "month"
                ? setCursor((c) => addMonths(c, 1))
                : setSelectedDate((d) => addDays(d, 7))
            }
            className="flex h-9 w-9 items-center justify-center rounded-full text-brand active:bg-track"
          >
            ›
          </button>
        </div>
        <div className="flex gap-1 rounded-xl bg-track p-1 text-[13px]">
          <button
            type="button"
            onClick={() => setViewMode("month")}
            className={clsx(
              "rounded-lg px-3 py-1.5 font-semibold transition-colors",
              viewMode === "month" ? "bg-surface text-foreground shadow-sm" : "text-subtle"
            )}
          >
            月
          </button>
          <button
            type="button"
            onClick={() => setViewMode("week")}
            className={clsx(
              "rounded-lg px-3 py-1.5 font-semibold transition-colors",
              viewMode === "week" ? "bg-surface text-foreground shadow-sm" : "text-subtle"
            )}
          >
            週
          </button>
        </div>
      </section>

      <MemberFilterChips members={members} selected={memberFilter} onToggle={toggleMember} />

      <section className="rounded-2xl bg-surface p-3 shadow-card ring-1 ring-line-soft">
        <div className="grid grid-cols-7 gap-1 text-center text-[11px]">
          {WEEKDAYS.map((w, i) => (
            <div
              key={w}
              className={clsx("py-1", i === 0 ? "text-rose-500" : i === 6 ? "text-sky-500" : "text-muted")}
            >
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const dayEvents = eventsByDay.get(key) ?? [];
            const visibleDots = dayEvents.slice(0, 3);
            const overflowCount = dayEvents.length - visibleDots.length;
            const inMonth = viewMode === "week" || isSameMonth(day, cursor);
            const selected = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, TODAY);
            const dow = day.getDay();
            return (
              <button
                type="button"
                key={key}
                onClick={() => setSelectedDate(day)}
                className={clsx(
                  "flex min-h-[3.4rem] flex-col items-center rounded-xl p-1 text-xs transition-colors",
                  selected ? "bg-brand/10 ring-1 ring-brand" : "active:bg-track",
                  !inMonth && "opacity-30"
                )}
              >
                <span
                  className={clsx(
                    "flex h-6 w-6 items-center justify-center rounded-full text-[13px]",
                    isToday
                      ? "bg-brand text-white font-semibold"
                      : dow === 0
                        ? "text-rose-500"
                        : dow === 6
                          ? "text-sky-500"
                          : undefined
                  )}
                >
                  {format(day, "d")}
                </span>
                <div className="mt-1 flex flex-wrap items-center justify-center gap-0.5">
                  {visibleDots.map((ev) => (
                    <span
                      key={ev.id}
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: findMemberById(members, ev.memberId)?.color }}
                    />
                  ))}
                  {overflowCount > 0 && (
                    <span className="text-[9px] font-semibold leading-none text-muted">+{overflowCount}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between px-1">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted">
            {format(selectedDate, "M月d日(E)", { locale: ja })}の予定
          </h2>
          <button type="button" onClick={() => openNewForm(selectedDate)} className="btn-add">
            ＋ 予定を追加
          </button>
        </div>
        <div className="divide-y divide-line-soft rounded-2xl bg-surface shadow-card ring-1 ring-line-soft">
          {selectedDayEvents.length === 0 && (
            <EmptyState
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                  <rect x="3.5" y="5.5" width="17" height="15" rx="2.5" />
                  <path d="M3.5 9.5h17M8 3v4M16 3v4" />
                </svg>
              }
              message="この日の予定はありません"
              actionLabel="予定を追加"
              onAction={() => openNewForm(selectedDate)}
            />
          )}
          {selectedDayEvents.map((event) => {
            const member = findMemberById(members, event.memberId);
            return (
              <Link
                key={event.id}
                href={`/schedule/${event.id}`}
                className="flex w-full items-center gap-3 p-3.5 text-left active:bg-track"
              >
                <ColorAvatar label={member?.name ?? "?"} color={member?.color} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium text-foreground">{event.title}</p>
                  <p className="text-[12px] text-muted">
                    {formatEventSchedule(event)} ・ {member?.name}
                    {event.recurrence && event.recurrence !== "none"
                      ? ` ・ ${event.recurrence === "weekly" ? "毎週" : "毎月"}`
                      : ""}
                  </p>
                </div>
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 flex-shrink-0 text-muted">
                  <path d="m8 5 5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            );
          })}
        </div>
      </section>

      {showForm && (
        <BottomSheet title="予定を追加" onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <label className="text-[12px] text-muted">
                タイトル
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, title: e.target.value }));
                    if (titleError) setTitleError(null);
                  }}
                  className={fieldClass(!!titleError)}
                  placeholder="例: 家族会議"
                />
                {titleError && <FieldError>{titleError}</FieldError>}
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="text-[12px] text-muted">
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
                    className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-[16px] text-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                  />
                </label>
                <label className="text-[12px] text-muted">
                  開始時刻（任意）
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-[16px] text-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="text-[12px] text-muted">
                  終了日
                  <input
                    type="date"
                    required
                    min={form.startDate}
                    value={form.endDate}
                    onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-[16px] text-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                  />
                </label>
                <label className="text-[12px] text-muted">
                  終了時刻（任意）
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-[16px] text-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                  />
                </label>
              </div>
              <p className="-mt-1 text-[11px] text-muted">
                終了日を開始日より後にすると、その期間すべての日にこの予定が表示されます。
              </p>

              <label className="text-[12px] text-muted">
                メンバー
                <select
                  value={form.memberId}
                  onChange={(e) => setForm((f) => ({ ...f, memberId: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[16px] text-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-[12px] text-muted">
                繰り返し
                <select
                  value={form.recurrence}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      recurrence: e.target.value as ScheduleEvent["recurrence"],
                    }))
                  }
                  className="mt-1 w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[16px] text-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                >
                  <option value="none">なし</option>
                  <option value="weekly">毎週</option>
                  <option value="monthly">毎月</option>
                </select>
              </label>
              <label className="text-[12px] text-muted">
                メモ
                <input
                  type="text"
                  value={form.memo}
                  onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[16px] text-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                  placeholder="任意"
                />
              </label>

            <SheetActions onCancel={() => setShowForm(false)} submitLabel="保存" saving={saving} />
          </form>
        </BottomSheet>
      )}
    </div>
  );
}
