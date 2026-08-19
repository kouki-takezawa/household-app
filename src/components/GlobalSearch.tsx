"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { searchAll, type SearchResults } from "@/lib/actions";
import { formatYen } from "@/lib/types";

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [pending, startTransition] = useTransition();

  function handleChange(value: string) {
    setQuery(value);
    if (!value.trim()) {
      setResults(null);
      return;
    }
    startTransition(async () => {
      const r = await searchAll(value);
      setResults(r);
    });
  }

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
          className="w-full rounded-full border border-line bg-surface py-2.5 pl-10 pr-4 text-[15px] text-foreground shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
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
              <h3 className="mb-1.5 px-1 text-[12px] font-semibold uppercase tracking-wide text-muted">
                家計簿
              </h3>
              <div className="divide-y divide-line-soft rounded-2xl bg-surface shadow-[0_2px_20px_-6px_rgba(120,90,40,0.14)] ring-1 ring-line-soft">
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
              <h3 className="mb-1.5 px-1 text-[12px] font-semibold uppercase tracking-wide text-muted">
                予定
              </h3>
              <div className="divide-y divide-line-soft rounded-2xl bg-surface shadow-[0_2px_20px_-6px_rgba(120,90,40,0.14)] ring-1 ring-line-soft">
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
              <h3 className="mb-1.5 px-1 text-[12px] font-semibold uppercase tracking-wide text-muted">
                資産記録
              </h3>
              <div className="divide-y divide-line-soft rounded-2xl bg-surface shadow-[0_2px_20px_-6px_rgba(120,90,40,0.14)] ring-1 ring-line-soft">
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
