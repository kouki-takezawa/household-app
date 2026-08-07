import { getAssetAccounts, getAssetSnapshots } from "@/lib/gas";
import AssetsClient from "./AssetsClient";

export default async function AssetsPage() {
  const [accounts, snapshots] = await Promise.all([
    getAssetAccounts(),
    getAssetSnapshots(),
  ]);

  return <AssetsClient accounts={accounts} initialSnapshots={snapshots} />;
}
