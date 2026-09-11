"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { searchAll, type SearchResults } from "@/lib/actions";
import { SearchResultsList } from "@/components/SearchResultsList";
import { SlidePage } from "@/components/SlidePage";
import { EmptyState } from "@/components/EmptyState";

// ヘッダーのプレビュー（GlobalSearch）は最大8件までしか見せないため、
// 「他◯件」の続きを見るための全件表示ページ。上限は実質青天井にしつつ、
// GASへの応答負荷を考えて一応の上限は設けておく。
const FULL_LIMIT = 500;
const SEARCH_DEBOUNCE_MS = 350;

export default function SearchPageClient() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [pending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function runSearch(value: string) {
    startTransition(async () => {
      const r = await searchAll(value, FULL_LIMIT);
      setResults(r);
    });
  }

  function handleChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setResults(null);
      return;
    }
    debounceRef.current = setTimeout(() => runSearch(value), SEARCH_DEBOUNCE_MS);
  }

  useEffect(() => {
    // URLの ?q= から来た初期クエリを、入力を待たずに一度だけ検索しておく
    // （ヘッダーの「他◯件」リンクから遷移した直後に結果が見えるように）。
    if (query.trim()) runSearch(query);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- マウント時の初期クエリのみで一度だけ実行する
  }, []);

  const hasQuery = query.trim().length > 0;
  const totalCount = results
    ? results.transactions.length + results.events.length + results.snapshots.length
    : 0;

  return (
    <SlidePage title="検索結果" backHref="/">
      <div className="flex flex-col gap-4 pt-2">
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
            autoFocus
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="家計簿・予定・資産記録を検索"
            className="w-full rounded-full border border-line bg-surface py-2.5 pl-10 pr-4 text-[15px] text-foreground shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
        </div>

        {!hasQuery && (
          <p className="px-1 text-[13px] text-muted">キーワードを入力してください</p>
        )}
        {hasQuery && pending && <p className="px-1 text-[13px] text-muted">検索中…</p>}
        {hasQuery && !pending && totalCount === 0 && (
          <EmptyState
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                <circle cx="10.5" cy="10.5" r="6.5" />
                <path d="m20 20-4-4" strokeLinecap="round" />
              </svg>
            }
            message="該当する記録が見つかりません"
          />
        )}
        {hasQuery && !pending && !!results && totalCount > 0 && (
          <SearchResultsList results={results} query={query} variant="full" />
        )}
      </div>
    </SlidePage>
  );
}
