/** 入力欄の共通スタイル。エラー時は赤枠にする。 */
export function fieldClass(hasError = false): string {
  return `mt-1 w-full rounded-xl border bg-surface px-3.5 py-2.5 text-[16px] text-foreground focus:outline-none focus:ring-2 ${
    hasError
      ? "border-rose-400 focus:ring-rose-400/30"
      : "border-line focus:border-brand focus:ring-brand/30"
  }`;
}

export function FieldError({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-[12px] text-rose-500">{children}</p>;
}
