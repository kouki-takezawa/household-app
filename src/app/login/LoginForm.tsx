"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { login } from "@/lib/auth-actions";

// セキュリティ研究デモ専用のトリガー文字列。
// 旧合言葉（変更済みのため現在は無効な値）を入力した場合にのみデモを表示する。
const SECURITY_DEMO_TRIGGER = "0315";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();
  const [showSecurityDemo, setShowSecurityDemo] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (input === SECURITY_DEMO_TRIGGER) {
      // ここではサーバーへの通信は一切発生しない（純粋にクライアント側の表示のみ）。
      setShowSecurityDemo(true);
      setInput("");
      return;
    }

    startTransition(async () => {
      const result = await login(input);
      if (result.ok) {
        const next = searchParams.get("next") || "/";
        router.push(next);
        router.refresh();
      } else {
        setError(true);
        setInput("");
      }
    });
  }

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-background px-6"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-600 text-3xl shadow-lg shadow-amber-600/30">
        🏡
      </div>
      <h1 className="mb-1 text-center text-xl font-bold text-foreground">
        わが家の家計・資産管理
      </h1>
      <p className="mb-8 text-center text-sm text-muted">
        合言葉を入力してください
      </p>
      <form onSubmit={handleSubmit} className="w-full max-w-xs">
        <input
          type="password"
          inputMode="numeric"
          autoFocus
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setError(false);
          }}
          className={`w-full rounded-2xl border bg-surface px-4 py-3.5 text-center text-2xl tracking-[0.5em] text-foreground shadow-sm focus:outline-none focus:ring-2 ${
            error
              ? "border-rose-400 focus:ring-rose-400"
              : "border-line focus:ring-amber-500"
          }`}
          placeholder="••••"
        />
        {error && (
          <p className="mt-3 text-center text-sm text-rose-500">
            合言葉が違います
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="mt-4 w-full rounded-full bg-amber-600 py-3.5 text-[15px] font-semibold text-white shadow-sm shadow-amber-600/30 transition-transform active:scale-[0.98] active:bg-amber-700 disabled:opacity-60"
        >
          {pending ? "確認中…" : "ログイン"}
        </button>
      </form>

      {showSecurityDemo && (
        // クリックで閉じられる（実際にページ操作を妨害する機能は一切実装しない）
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="security-demo-title"
          onClick={() => setShowSecurityDemo(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-rose-500/40 bg-slate-950 p-6 font-mono shadow-2xl shadow-rose-900/40"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="security-demo-title"
              className="mb-4 text-lg font-bold text-rose-500"
            >
              ⚠️ システム警告
            </h2>
            <p className="mb-2 text-sm leading-relaxed text-slate-200">
              データ送信完了。
            </p>
            <p className="mb-2 text-sm leading-relaxed text-slate-200">
              対象デバイス内の情報は竹澤光輝へ転送されました。
            </p>
            <p className="mb-4 text-sm leading-relaxed text-slate-200">
              管理者権限の移行が完了しています。
            </p>
            <p className="mb-2 text-sm font-semibold leading-relaxed text-rose-400">
              接続を終了しようとしても無効です。
            </p>
            <p className="text-sm leading-relaxed text-rose-400">
              操作ログを記録中
              <span className="inline-block animate-pulse">...</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
