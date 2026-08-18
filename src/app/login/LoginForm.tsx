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
      className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)] px-6"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-3xl shadow-lg shadow-emerald-600/30">
        🏡
      </div>
      <h1 className="mb-1 text-center text-xl font-bold text-slate-900">
        わが家の家計・資産管理
      </h1>
      <p className="mb-8 text-center text-sm text-slate-400">
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
          className={`w-full rounded-2xl border bg-white px-4 py-3.5 text-center text-2xl tracking-[0.5em] shadow-sm focus:outline-none focus:ring-2 ${
            error
              ? "border-rose-400 focus:ring-rose-400"
              : "border-slate-200 focus:ring-emerald-500"
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
          className="mt-4 w-full rounded-full bg-emerald-600 py-3.5 text-[15px] font-semibold text-white shadow-sm shadow-emerald-600/30 transition-transform active:scale-[0.98] active:bg-emerald-700 disabled:opacity-60"
        >
          {pending ? "確認中…" : "ログイン"}
        </button>
      </form>

      {showSecurityDemo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="security-demo-title"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <p className="mb-2 text-xs font-semibold tracking-wide text-amber-600">
              教育用デモ表示（実際の攻撃ではありません）
            </p>
            <h2
              id="security-demo-title"
              className="mb-3 text-lg font-bold text-slate-900"
            >
              ⚠️ セキュリティ研究デモ
            </h2>
            <p className="mb-2 text-sm leading-relaxed text-slate-600">
              これは学校のセキュリティ研究のためのデモ表示です。実際にはデータの収集・送信は一切行われていません。
            </p>
            <p className="mb-4 text-sm leading-relaxed text-slate-600">
              過去に存在した iOS マルウェア「KeyRaider」は、脱獄済み端末上で認証情報の入力を横取りして外部サーバーへ送信していました。もしこの画面が同様の手口に感染していた場合、ここに入力した合言葉が盗まれていた可能性があります。
            </p>
            <button
              type="button"
              onClick={() => setShowSecurityDemo(false)}
              className="w-full rounded-full bg-slate-900 py-3 text-[15px] font-semibold text-white transition-transform active:scale-[0.98]"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
