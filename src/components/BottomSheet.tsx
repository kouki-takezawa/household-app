"use client";

// スマホでは画面下からせり上がる「ボトムシート」、sm 以上では中央に浮くダイアログとして表示する
// 共通コンテナ。以前は AccountDetailClient / BudgetClient / ScheduleClient がそれぞれ同じ見た目の
// フォームラッパーをベタ書きしていたため、1箇所に集約して見た目のズレが起きないようにする。
export function BottomSheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      role="presentation"
      onClick={onClose}
    >
      {/* ページ（bg-surface）の上に重なる要素として、暗色時は surface-2 を使う
          （Linear のサーフェス階段に倣った、シャドウだけに頼らないエレベーション表現）。 */}
      <div
        className="w-full max-w-sm rounded-t-3xl bg-surface-2 px-5 pt-3 shadow-xl sm:rounded-3xl sm:pt-5"
        style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line sm:hidden" />
        <h3 className="mb-4 text-[17px] font-bold text-foreground">{title}</h3>
        {children}
      </div>
    </div>
  );
}

export function SheetActions({
  onCancel,
  submitLabel,
  savingLabel = "保存中…",
  saving = false,
}: {
  onCancel: () => void;
  submitLabel: string;
  savingLabel?: string;
  saving?: boolean;
}) {
  return (
    <div className="mt-5 flex gap-2">
      <button
        type="button"
        onClick={onCancel}
        className="btn-lg flex-1 border border-line text-subtle active:opacity-70"
      >
        キャンセル
      </button>
      <button
        type="submit"
        disabled={saving}
        className="btn-lg flex-1 bg-brand text-white shadow-sm shadow-brand/30 active:scale-[0.98] disabled:opacity-60"
      >
        {saving ? savingLabel : submitLabel}
      </button>
    </div>
  );
}
