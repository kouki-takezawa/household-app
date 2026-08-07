import { getMembers, getCategories, getAssetAccounts } from "@/lib/gas";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const [members, categories, assetAccounts] = await Promise.all([
    getMembers(),
    getCategories(),
    getAssetAccounts(),
  ]);

  return (
    <SettingsClient
      initialMembers={members}
      initialCategories={categories}
      initialAssetAccounts={assetAccounts}
    />
  );
}
