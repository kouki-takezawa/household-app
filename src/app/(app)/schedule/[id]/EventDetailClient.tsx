"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  type Member,
  type ScheduleEvent,
  findMemberById,
  formatEventSchedule,
} from "@/lib/types";
import { addEvent, editEvent, removeEvent } from "@/lib/actions";
import { ColorAvatar } from "@/components/ColorAvatar";
import { SlidePage } from "@/components/SlidePage";
import { SheetActions } from "@/components/BottomSheet";
import { useToast } from "@/components/Toast";
import { useConfirm } from "@/components/ConfirmDialog";
import { fieldClass, FieldError } from "@/components/form";
import { describeError } from "@/lib/errors";

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
  const confirmDialog = useConfirm();
  const member = findMemberById(members, event.memberId);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [titleError, setTitleError] = useState<string | null>(null);
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
    if (!form.title.trim()) {
      setTitleError("タイトルを入力してください");
      return;
    }
    setTitleError(null);
    const endDate = form.endDate < form.startDate ? form.startDate : form.endDate;
    setSaving(true);
    try {
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
      showToast("更新しました");
      router.push("/schedule");
    } catch (err) {
      showToast(describeError(err, "更新に失敗しました"), { variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    const ok = await confirmDialog({ title: "この予定を削除しますか？", danger: true });
    if (!ok) return;

    try {
      await removeEvent(event.id);
      showToast("削除しました", {
        actionLabel: "元に戻す",
        onAction: async () => {
          try {
            await addEvent(event);
          } catch (err) {
            showToast(describeError(err, "元に戻せませんでした"), { variant: "error" });
          }
        },
      });
      router.push("/schedule");
    } catch (err) {
      showToast(describeError(err, "削除に失敗しました"), { variant: "error" });
    }
  }

  if (editing) {
    return (
      <SlidePage title="予定を編集" backHref="/schedule">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 pt-2">
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
                  recurrence: e.target.value as "none" | "weekly" | "monthly",
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
          <SheetActions onCancel={() => setEditing(false)} submitLabel="保存" saving={saving} />
        </form>
      </SlidePage>
    );
  }

  return (
    <SlidePage title="予定の詳細" backHref="/schedule">
      <div className="flex flex-col gap-4 pt-2">
        <div className="rounded-2xl bg-surface p-5 shadow-card ring-1 ring-line-soft">
          <div className="flex items-start gap-3">
            <ColorAvatar label={member?.name ?? "?"} color={member?.color} />
            <div className="min-w-0">
              <h2 className="text-[19px] font-semibold text-foreground">{event.title}</h2>
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
            className="btn-lg flex-1 border border-line text-foreground active:opacity-70"
          >
            編集
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="btn-lg flex-1 border border-rose-200 text-rose-500 active:bg-rose-500/10"
          >
            削除
          </button>
        </div>
      </div>
    </SlidePage>
  );
}
