"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function SlidePage({
  title,
  backHref,
  children,
}: {
  title: string;
  /**
   * 一覧画面に戻る先のURL。詳細ページへ直接リンク・リロードで来た場合は
   * ブラウザの履歴が空で router.back() が反応しないことがあるため、
   * 履歴があれば back()、無ければこの backHref へ push するフォールバックを持つ。
   */
  backHref: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  function goBack() {
    // このページ自体がエントリーポイント（直接アクセス・リロード）だと history.length は
    // ごく短い。アプリ内遷移で来た場合のみ back() を使い、そうでなければ backHref へ push
    // するフォールバックを持つ（クリック時に判定すれば十分で、state化する必要はない）。
    const hasHistory = window.history.length > 1 && document.referrer.startsWith(window.location.origin);
    if (hasHistory) {
      router.back();
    } else {
      router.push(backHref);
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 flex flex-col bg-background transition-transform duration-300 ease-out"
      style={{
        transform: entered ? "translateX(0)" : "translateX(100%)",
        paddingTop: "env(safe-area-inset-top)",
      }}
    >
      <header className="mx-auto flex w-full max-w-3xl flex-shrink-0 items-center gap-1 px-2 pb-2 pt-3">
        <button
          type="button"
          onClick={goBack}
          aria-label="戻る"
          className="flex h-9 w-9 items-center justify-center rounded-full text-brand active:bg-track"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
            <path d="m15 19-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="truncate text-[17px] font-semibold text-foreground">{title}</h1>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 overflow-y-auto px-4 pb-28">
        {children}
      </main>
    </div>
  );
}
