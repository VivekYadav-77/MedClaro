import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { getReports, getUserProfile } from "@/lib/api";

export default async function DashboardPage() {
  const [user, reports] = await Promise.all([getUserProfile(), getReports()]);

  return <DashboardClient user={user} reports={reports} />;
}
