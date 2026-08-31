// ネイティブ <details>/<summary> ベースの折りたたみセクション。
// JS状態を持たないため Server Component（ダッシュボードの page.tsx 等）からも
// そのまま使え、閉じた状態では中身がDOMに存在するだけでレイアウトの高さを取らない
// （グラフ等の重いセクションをスマホの初期スクロール量から外すのに使う）。
export function Collapsible({
  title,
  icon,
  defaultOpen = false,
  summaryRight,
  className = "",
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  /** サマリー行の右側に出す補足（例: 内訳の合計額など） */
  summaryRight?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <details
      className={`group rounded-2xl bg-surface shadow-card ring-1 ring-line-soft ${className}`}
      open={defaultOpen}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 p-4 [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-muted">
          {icon}
          {title}
        </span>
        <span className="flex items-center gap-2">
          {summaryRight}
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-4 w-4 flex-shrink-0 text-muted transition-transform duration-200 group-open:rotate-180"
          >
            <path d="m4 6 4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </summary>
      <div className="px-4 pb-4">{children}</div>
    </details>
  );
}
