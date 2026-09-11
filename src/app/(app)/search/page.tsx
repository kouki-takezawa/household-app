import { Suspense } from "react";
import SearchPageClient from "./SearchPageClient";

export default function SearchPage() {
  // SearchPageClient は ?q= のディープリンクに対応するため useSearchParams() を使う。
  // Next.js の要求により Suspense 境界が必要。
  return (
    <Suspense>
      <SearchPageClient />
    </Suspense>
  );
}
