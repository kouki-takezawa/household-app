"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  type Member,
  type ScheduleEvent,
  findMemberById,
  formatEventSchedule,
} from "@/lib/types";
import { editEvent, removeEvent } from "@/lib/actions";
import { SlidePage } from "@/components/SlidePage";
import { useToast } from "@/components/Toast";

const RECURRENCE_LABEL: Record<NonNullable<ScheduleEvent["recurrence"]>, string> = {
  none: "なし",
  weekly: "毎週",
  monthly: "毎月",
};

export default function EventDetailClient({
  event,
  members,
}: {
  event: ScheduleEvent;
  members: Member[];
}) {
  const router = useRouter();
  const showToast = useToast();
  const member = findMemberById(members, event.memberId);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: event.title,
    startDate: event.startDate,
    startTime: event.startTime ?? "",
    endDate: event.endDate,
    endTime: event.endTime ?? "",
    memberId: event.memberId,
    recurrence: event.recurrence ?? "none",
    memo: event.memo ?? "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    const endDate = form.endDate < form.startDate ? form.startDate : form.endDate;
    setSaving(true);
    await editEvent(event.id, {
      title: form.title,
      startDate: form.startDate,
      startTime: form.startTime || undefined,
      endDate,
      endTime: form.endTime || undefined,
      memberId: form.memberId,
      recurrence: form.recurrence,
      memo: form.memo || undefined,
    });
    setSaving(false);
    showToast("更新しました");
    router.back();
  }

  async function handleDelete() {
    if (!confirm("この予定を削除しますか？")) return;
    await removeEvent(event.id);
    showToast("削除しました");
    router.back();
  }

  if (editing) {
    return (
      <SlidePage title="予定を編集">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 pt-2">
          <label className="text-[12px] text-muted">
            タイトル
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[16px] text-foreground focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            />
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
                className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-[16px] text-foreground focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </label>
            <label className="text-[12px] text-muted">
              開始時刻（任意）
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-[16px] text-foreground focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
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
                className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-[16px] text-foreground focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </label>
            <label className="text-[12px] text-muted">
              終了時刻（任意）
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-[16px] text-foreground focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </label>
          </div>
          <label className="text-[12px] text-muted">
            メンバー
            <select
              value={form.memberId}
              onChange={(e) => setForm((f) => ({ ...f, memberId: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[16px] text-foreground focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
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
                  recurrence: e.target.value as "none" | "weekly" | "monthly",
                }))
              }
              className="mt-1 w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[16px] text-foreground focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
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
              className="mt-1 w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[16px] text-foreground focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              placeholder="任意"
            />
          </label>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="flex-1 rounded-full border border-line py-3 text-[15px] font-semibold text-subtle active:opacity-70"
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
      </SlidePage>
    );
  }

  return (
    <SlidePage title="予定の詳細">
      <div className="flex flex-col gap-4 pt-2">
        <div className="rounded-2xl bg-surface p-5 shadow-[0_2px_20px_-6px_rgba(120,90,40,0.14)] ring-1 ring-line-soft">
          <div className="flex items-start gap-3">
            <span
              className="mt-1.5 h-3 w-3 flex-shrink-0 rounded-full"
              style={{ backgroundColor: member?.color }}
            />
            <div className="min-w-0">
              <h2 className="text-[19px] font-bold text-foreground">{event.title}</h2>
              <p className="mt-1 text-[14px] text-muted">{formatEventSchedule(event)}</p>
            </div>
          </div>

          <dl className="mt-5 flex flex-col gap-3 border-t border-line-soft pt-4 text-[14px]">
            <div className="flex justify-between">
              <dt className="text-muted">メンバー</dt>
              <dd className="font-medium text-foreground">{member?.name ?? "―"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">繰り返し</dt>
              <dd className="font-medium text-foreground">
                {RECURRENCE_LABEL[event.recurrence ?? "none"]}
              </dd>
            </div>
            {event.memo && (
              <div className="flex justify-between gap-4">
                <dt className="flex-shrink-0 text-muted">メモ</dt>
                <dd className="text-right font-medium text-foreground">{event.memo}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex-1 rounded-full border border-line py-3 text-[15px] font-semibold text-foreground active:opacity-70"
          >
            編集
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="flex-1 rounded-full border border-rose-200 py-3 text-[15px] font-semibold text-rose-500 active:bg-rose-500/10"
          >
            削除
          </button>
        </div>
      </div>
    </SlidePage>
  );
}
