import { Suspense } from "react";
import { getMembers, getCategories, getAssetAccounts } from "@/lib/gas";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const [members, categories, assetAccounts] = await Promise.all([
    getMembers(),
    getCategories(),
    getAssetAccounts(),
  ]);

  return (
    // SettingsClient は /settings?tab=assets のようなディープリンクに対応するため
    // useSearchParams() を使う。Next.js の要求により Suspense 境界が必要。
    <Suspense>
      <SettingsClient
        initialMembers={members}
        initialCategories={categories}
        initialAssetAccounts={assetAccounts}
      />
    </Suspense>
  );
}
