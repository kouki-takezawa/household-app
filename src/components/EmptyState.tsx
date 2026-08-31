export function EmptyState({
  icon,
  message,
  actionLabel,
  onAction,
}: {
  icon: React.ReactNode;
  message: string;
  /** 指定すると、空状態からワンタップで登録操作に進めるCTAボタンを表示する。 */
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 p-8 text-center">
      {/* グレー一色だと空の瞬間だけブランドの温度が消えてしまうため、
          薄いブランドトーンの背景にする（各ブランドとも空状態やアイコンに
          アクセントカラーを薄く残す慣習がある）。 */}
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand/10 text-brand">
        {icon}
      </span>
      <p className="text-[13px] text-muted">{message}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="rounded-full bg-brand px-4 py-2 text-[13px] font-semibold text-white shadow-sm shadow-brand/30 transition-transform active:scale-95"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
