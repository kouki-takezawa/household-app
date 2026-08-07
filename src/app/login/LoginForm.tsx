"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { login } from "@/lib/auth-actions";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
    </div>
  );
}
