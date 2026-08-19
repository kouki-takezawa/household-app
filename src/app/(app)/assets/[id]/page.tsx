import { notFound } from "next/navigation";
import { getAssetAccounts, getAssetSnapshots, getMembers } from "@/lib/gas";
import AccountDetailClient from "./AccountDetailClient";

export default async function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [accounts, snapshots, members] = await Promise.all([
    getAssetAccounts(),
    getAssetSnapshots(),
    getMembers(),
  ]);
  const account = accounts.find((a) => a.id === id);

  if (!account) notFound();

  const accountSnapshots = snapshots.filter((s) => s.assetAccountId === id);

  return (
    <AccountDetailClient
      account={account}
      initialSnapshots={accountSnapshots}
      members={members}
    />
  );
}
