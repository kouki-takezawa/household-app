"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { searchAll, type SearchResults } from "@/lib/actions";
import { formatYen } from "@/lib/types";

// バックエンドが Google Apps Script 経由（応答に数秒かかることがある。gas.ts 参照）のため、
// 1文字入力するたびにリクエストを飛ばすと連続リクエストで詰まってしまう。
// 入力が落ち着いてから検索する（デバウンス）ことでリクエスト数を抑える。
const SEARCH_DEBOUNCE_MS = 350;

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [pending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setResults(null);
      return;
    }
    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const r = await searchAll(value);
        setResults(r);
      });
    }, SEARCH_DEBOUNCE_MS);
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const hasQuery = query.trim().length > 0;
  const totalCount = results
    ? results.transactions.length + results.events.length + results.snapshots.length
    : 0;

  return (
    <div>
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="9" cy="9" r="6" />
          <path d="m17 17-3.5-3.5" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="家計簿・予定・資産記録を検索"
          className="w-full rounded-full border border-line bg-surface py-2.5 pl-10 pr-4 text-[15px] text-foreground shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
        />
      </div>

      {hasQuery && (
        <div className="mt-3 flex flex-col gap-4">
          {pending && <p className="px-1 text-[13px] text-muted">検索中…</p>}
          {!pending && totalCount === 0 && (
            <p className="px-1 text-[13px] text-muted">該当する記録が見つかりません</p>
          )}

          {!!results?.transactions.length && (
            <div>
              <h3 className="mb-1.5 flex items-baseline justify-between px-1 text-[12px] font-semibold uppercase tracking-wide text-muted">
                <span>家計簿</span>
                {results.totalCounts.transactions > results.transactions.length && (
                  <Link href="/budget" className="normal-case text-brand">
                    他{results.totalCounts.transactions - results.transactions.length}件 →
                  </Link>
                )}
              </h3>
              <div className="divide-y divide-line-soft rounded-2xl bg-surface shadow-card ring-1 ring-line-soft">
                {results.transactions.map((t) => (
                  <Link
                    key={t.id}
                    href="/budget"
                    className="flex items-center gap-3 p-3.5 active:bg-track"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium text-foreground">
                        {t.categoryName}
                        {t.memo ? ` ・ ${t.memo}` : ""}
                      </p>
                      <p className="text-[12px] text-muted">{t.date}</p>
                    </div>
                    <p
                      className={`text-[14px] font-semibold ${
                        t.type === "income" ? "text-emerald-600" : "text-rose-500"
                      }`}
                    >
                      {t.type === "income" ? "+" : "-"}
                      {formatYen(t.amount)}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {!!results?.events.length && (
            <div>
              <h3 className="mb-1.5 flex items-baseline justify-between px-1 text-[12px] font-semibold uppercase tracking-wide text-muted">
                <span>予定</span>
                {results.totalCounts.events > results.events.length && (
                  <Link href="/schedule" className="normal-case text-brand">
                    他{results.totalCounts.events - results.events.length}件 →
                  </Link>
                )}
              </h3>
              <div className="divide-y divide-line-soft rounded-2xl bg-surface shadow-card ring-1 ring-line-soft">
                {results.events.map((e) => (
                  <Link
                    key={e.id}
                    href={`/schedule/${e.id}`}
                    className="flex items-center gap-3 p-3.5 active:bg-track"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium text-foreground">{e.title}</p>
                      <p className="text-[12px] text-muted">
                        {e.startDate}
                        {e.memberName ? ` ・ ${e.memberName}` : ""}
                      </p>
                    </div>
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 flex-shrink-0 text-muted">
                      <path d="m8 5 5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {!!results?.snapshots.length && (
            <div>
              <h3 className="mb-1.5 flex items-baseline justify-between px-1 text-[12px] font-semibold uppercase tracking-wide text-muted">
                <span>資産記録</span>
                {results.totalCounts.snapshots > results.snapshots.length && (
                  <Link href="/assets" className="normal-case text-brand">
                    他{results.totalCounts.snapshots - results.snapshots.length}件 →
                  </Link>
                )}
              </h3>
              <div className="divide-y divide-line-soft rounded-2xl bg-surface shadow-card ring-1 ring-line-soft">
                {results.snapshots.map((s) => (
                  <Link
                    key={s.id}
                    href={`/assets/${s.accountId}`}
                    className="flex items-center gap-3 p-3.5 active:bg-track"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium text-foreground">
                        {s.accountName}
                        {s.note ? ` ・ ${s.note}` : ""}
                      </p>
                      <p className="text-[12px] text-muted">{s.date}</p>
                    </div>
                    <p className="text-[14px] font-semibold text-foreground">{formatYen(s.value)}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
