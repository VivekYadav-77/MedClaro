import { ReactNode } from "react";
import { GlobalChatWidget } from "@/components/layout/global-chat-widget";
import { Navbar } from "@/components/layout/navbar";
import { UserProfile } from "@/lib/types";

export function AppShell({
  user,
  children
}: {
  user: UserProfile;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 animate-fade-in">
        {children}
      </main>
      <GlobalChatWidget />
    </div>
  );
}
