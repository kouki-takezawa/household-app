// 一覧行の「編集」「削除」をテキストではなくアイコンで統一するための共通アイコン。
// 既存コードの慣習（ライブラリを足さずインラインSVGを使う）に合わせている。

export function PencilIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path
        d="M13.5 3.5a1.7 1.7 0 0 1 2.4 2.4L6.5 15.3l-3 .7.7-3 9.3-9.3Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TrashIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M4 6h12M8 6V4.5h4V6M6 6l.6 9.5a1 1 0 0 0 1 .9h4.8a1 1 0 0 0 1-.9L14 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconButton({
  onClick,
  label,
  variant = "default",
  children,
}: {
  onClick: () => void;
  label: string;
  variant?: "default" | "danger";
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={
        variant === "danger"
          ? "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-rose-500 active:bg-rose-500/10"
          : "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-subtle active:bg-track"
      }
    >
      {children}
    </button>
  );
}
