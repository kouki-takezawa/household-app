"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { searchAll, type SearchResults } from "@/lib/actions";
import { SearchResultsList } from "@/components/SearchResultsList";

// バックエンドが Google Apps Script 経由（応答に数秒かかることがある。gas.ts 参照）のため、
// 1文字入力するたびにリクエストを飛ばすと連続リクエストで詰まってしまう。
// 入力が落ち着いてから検索する（デバウンス）ことでリクエスト数を抑える。
const SEARCH_DEBOUNCE_MS = 350;

export function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [pending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  }

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
      <form onSubmit={handleSubmit} className="relative">
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
      </form>

      {hasQuery && (
        <div className="mt-3 flex flex-col gap-4">
          {pending && <p className="px-1 text-[13px] text-muted">検索中…</p>}
          {!pending && totalCount === 0 && (
            <p className="px-1 text-[13px] text-muted">該当する記録が見つかりません</p>
          )}
          {!!results && <SearchResultsList results={results} query={query} variant="preview" />}
        </div>
      )}
    </div>
  );
}
