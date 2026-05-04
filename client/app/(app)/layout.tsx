import { AppShell } from "@/components/layout/app-shell";
import { getUserProfile } from "@/lib/api";

export default async function AuthenticatedLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const user = await getUserProfile();
  return <AppShell user={user}>{children}</AppShell>;
}
