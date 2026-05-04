import { FamilyClient } from "@/components/dashboard/family-client";
import { getUserProfile } from "@/lib/api";

export default async function FamilyPage() {
  const user = await getUserProfile();

  return <FamilyClient user={user} />;
}
