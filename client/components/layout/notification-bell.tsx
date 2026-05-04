"use client";

import { useEffect, useState } from "react";
import { Bell, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { AppNotification } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function NotificationBell() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const token = session?.accessToken;

  useEffect(() => {
    if (!token) return;
    void loadNotifications();
    const interval = window.setInterval(() => void loadNotifications(), 60000);
    return () => window.clearInterval(interval);
  }, [token]);

  async function loadNotifications() {
    if (!API_URL || !token) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) setNotifications(await response.json());
    } finally {
      setLoading(false);
    }
  }

  async function markRead(id: string) {
    if (!API_URL || !token) return;
    const response = await fetch(`${API_URL}/notifications/${id}/read`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.ok) setNotifications((current) => current.filter((item) => item.id !== id));
  }

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" onClick={() => setOpen((value) => !value)} aria-label="Notifications">
        <Bell className="h-5 w-5" />
        {notifications.length ? <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-red-500" /> : null}
      </Button>
      {open ? (
        <div className="absolute right-0 top-12 z-50 w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-dialog">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-semibold text-slate-900">Notifications</p>
            {loading ? <Loader2 className="h-4 w-4 animate-spin text-slate-400" /> : null}
          </div>
          <div className="max-h-80 space-y-2 overflow-y-auto">
            {notifications.slice(0, 10).map((notification) => (
              <div key={notification.id} className="rounded-lg bg-slate-50 p-3">
                <p className="text-sm text-slate-800">{notificationText(notification)}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 h-7 px-2"
                  onClick={() => void markRead(notification.id)}
                >
                  Mark read
                </Button>
              </div>
            ))}
            {!notifications.length ? <p className="py-4 text-center text-sm text-slate-500">No unread notifications.</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function notificationText(notification: AppNotification) {
  const entry = notification.feedEntry;
  if (entry.eventType === "circle_invite") {
    return `${entry.actorName} invited you to ${String(entry.payload.circleName ?? "a care circle")}.`;
  }
  if (entry.eventType === "report_uploaded") {
    return `${entry.actorName} uploaded a ${String(entry.payload.reportType ?? "health").replace(/_/g, " ")} report.`;
  }
  if (entry.eventType === "member_joined") {
    return `${String(entry.payload.name ?? entry.actorName)} joined the circle.`;
  }
  return `${entry.actorName} shared an update.`;
}
