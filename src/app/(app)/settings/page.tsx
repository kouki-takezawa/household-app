import { getMembers, getCategories } from "@/lib/gas";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const [members, categories] = await Promise.all([getMembers(), getCategories()]);

  return <SettingsClient initialMembers={members} initialCategories={categories} />;
}
