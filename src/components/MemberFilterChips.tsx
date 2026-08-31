import clsx from "clsx";
import type { Member } from "@/lib/types";

// 家計簿・日程表で共有するメンバー絞り込みチップ。
// 以前は非選択状態を opacity-40 だけで表現しており、色の濃淡だけに頼ると判別しづらい
// ケースがあるため、選択時はチェックマーク＋実線ボーダー、非選択時は破線ボーダーという
// 形状の違いも併用する。
//
// 個々のチップを浮かせて並べるのではなく、月次/年次トグルなどと同じ
// 「トラック背景＋選択中はsurfaceのピル」というグループ化パターンに揃えた
// （Wise/Cal.comのDESIGN.mdが言う"pill-in-pillでグループ化する"慣習）。
// 選択色もブランドグリーンではなくニュートラルにし、ブランド色は
// チェックマークだけに絞ることで「選択中の状態」と「実行するボタン」の
// 色の意味を分離している（Revolutの「primary色は希少に保つ」原則）。
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
    <section className="flex flex-wrap gap-1 rounded-2xl bg-track/60 p-1.5">
      {members.map((m) => {
        const isSelected = selected.has(m.id);
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onToggle(m.id)}
            aria-pressed={isSelected}
            className={clsx(
              "state-layer flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors",
              isSelected ? "bg-surface text-foreground shadow-sm" : "text-muted"
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
