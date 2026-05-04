import { SettingsClient } from "@/components/dashboard/settings-client";
import { getUserProfile } from "@/lib/api";

export default async function SettingsPage() {
  const user = await getUserProfile();

  return <SettingsClient user={user} />;
}
