import clsx from "clsx";
import type { Member } from "@/lib/types";

// 家計簿・日程表で共有するメンバー絞り込みチップ。
// 以前は非選択状態を opacity-40 だけで表現しており、色の濃淡だけに頼ると判別しづらい
// ケースがあるため、選択時はチェックマーク＋実線ボーダー、非選択時は破線ボーダーという
// 形状の違いも併用する。
export function MemberFilterChips({
  members,
  selected,
  onToggle,
}: {
  members: Member[];
  selected: Set<string>;
  onToggle: (id: string) => void;
}) {
  if (members.length === 0) return null;

  return (
    <section className="flex flex-wrap gap-2">
      {members.map((m) => {
        const isSelected = selected.has(m.id);
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onToggle(m.id)}
            aria-pressed={isSelected}
            className={clsx(
              "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors",
              isSelected
                ? "border-brand/40 bg-brand/5 text-foreground"
                : "border-dashed border-line-soft text-muted"
            )}
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: m.color }} />
            {m.name}
            {isSelected && (
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3 text-brand">
                <path d="m3.5 8.5 3 3 6-6.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        );
      })}
    </section>
  );
}
