import Link from "next/link";
import type { SearchResults } from "@/lib/actions";
import { formatCurrency, formatYen } from "@/lib/types";

// GlobalSearch（ヘッダーのプレビュー、最大8件）と /search（全件表示ページ）の
// 両方で同じ見た目の結果リストを使うための共通コンポーネント。
// variant="preview" のときだけ、件数が上限で切られている場合に
// /search への「他◯件 →」リンクを出す。
export function SearchResultsList({
  results,
  query,
  variant = "preview",
}: {
  results: SearchResults;
  query: string;
  variant?: "preview" | "full";
}) {
  const moreHref = `/search?q=${encodeURIComponent(query)}`;

  return (
    <div className="flex flex-col gap-4">
      {!!results.transactions.length && (
        <div>
          <h3 className="mb-1.5 flex items-baseline justify-between px-1 text-[12px] font-semibold uppercase tracking-wide text-muted">
            <span>家計簿</span>
            {variant === "preview" && results.totalCounts.transactions > results.transactions.length && (
              <Link href={moreHref} className="normal-case text-brand">
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

      {!!results.events.length && (
        <div>
          <h3 className="mb-1.5 flex items-baseline justify-between px-1 text-[12px] font-semibold uppercase tracking-wide text-muted">
            <span>予定</span>
            {variant === "preview" && results.totalCounts.events > results.events.length && (
              <Link href={moreHref} className="normal-case text-brand">
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

      {!!results.snapshots.length && (
        <div>
          <h3 className="mb-1.5 flex items-baseline justify-between px-1 text-[12px] font-semibold uppercase tracking-wide text-muted">
            <span>資産記録</span>
            {variant === "preview" && results.totalCounts.snapshots > results.snapshots.length && (
              <Link href={moreHref} className="normal-case text-brand">
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
                <p className="text-[14px] font-semibold text-foreground">
                  {formatCurrency(s.value, s.currency)}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
