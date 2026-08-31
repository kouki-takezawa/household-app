"use client";

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/10 text-rose-500">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7">
          <path d="M12 9v4M12 17h.01" strokeLinecap="round" />
          <path d="M10.3 3.9 2.5 17.5c-.7 1.3.2 3 1.7 3h15.6c1.5 0 2.4-1.7 1.7-3L13.7 3.9c-.7-1.2-2.7-1.2-3.4 0Z" />
        </svg>
      </span>
      <div>
        <h1 className="text-[17px] font-semibold text-foreground">読み込みに失敗しました</h1>
        <p className="mt-1 text-[13px] leading-relaxed text-muted">
          通信状況をご確認のうえ、もう一度お試しください。
          <br />
          問題が続く場合は、しばらく時間をおいてからお試しください。
        </p>
      </div>
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-full bg-brand px-6 py-2.5 text-[14px] font-semibold text-white shadow-sm shadow-brand/30 transition-transform active:scale-[0.98]"
      >
        再試行
      </button>
    </div>
  );
}
