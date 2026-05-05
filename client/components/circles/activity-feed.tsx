"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, FileText, UserPlus } from "lucide-react";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { FeedEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ActivityFeed({ entries }: { entries: FeedEntry[] }) {
  const { data: session } = useSession();
  const [localEntries, setLocalEntries] = useState(entries);

  useEffect(() => {
    setLocalEntries(entries);
  }, [entries]);

  async function toggleReaction(entry: FeedEntry) {
    if (!process.env.NEXT_PUBLIC_API_URL || !session?.accessToken) return;
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/circles/feed/${entry.id}/react`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });
    if (!response.ok) return;
    const data = await response.json();
    setLocalEntries((current) =>
      current.map((item) =>
        item.id === entry.id
          ? { ...item, userHasReacted: data.reacted, reactionCount: data.reactionCount }
          : item
      )
    );
  }

  if (!entries.length) {
    return <p className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">No activity yet.</p>;
  }

  return (
    <div className="space-y-3">
      {localEntries.map((entry) => (
        <div
          key={entry.id}
          className={cn(
            "flex gap-3 rounded-xl border p-3",
            entry.eventType === "marker_improved"
              ? "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white"
              : "border-slate-200 bg-white"
          )}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
            {iconFor(entry.eventType)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-900">{descriptionFor(entry)}</p>
            {entry.eventType === "marker_improved" ? (
              <p className="mt-2 text-sm font-semibold text-emerald-700">
                {improvedMarkers(entry).join(", ")}
              </p>
            ) : null}
            <p className="mt-1 text-xs text-slate-500">{timeAgo(entry.createdAt)}</p>
            {entry.eventType === "marker_improved" ? (
              <Button
                variant={entry.userHasReacted ? "teal" : "outline"}
                size="sm"
                className="mt-3"
                onClick={() => void toggleReaction(entry)}
              >
                Celebrate {entry.reactionCount ?? 0}
              </Button>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function iconFor(eventType: string) {
  if (eventType === "marker_improved") return <CheckCircle2 className="h-4 w-4" />;
  if (eventType === "member_joined" || eventType === "circle_invite") return <UserPlus className="h-4 w-4" />;
  return <FileText className="h-4 w-4" />;
}

function descriptionFor(entry: FeedEntry) {
  const payload = entry.payload;
  if (entry.eventType === "report_uploaded") {
    return `${entry.actorName} uploaded a ${String(payload.reportType ?? "health").replace(/_/g, " ")} report`;
  }
  if (entry.eventType === "marker_improved") {
    return `${String(payload.memberName ?? "A member")}'s marker is now in range`;
  }
  if (entry.eventType === "member_joined") {
    return `${String(payload.name ?? entry.actorName)} joined the circle`;
  }
  if (entry.eventType === "circle_invite") {
    return `${entry.actorName} invited you to ${String(payload.circleName ?? "a circle")}`;
  }
  if (entry.eventType === "circle_code_rotated") {
    return `${entry.actorName} changed the circle code`;
  }
  if (entry.eventType === "member_role_changed") {
    return `${entry.actorName} made ${String(payload.memberName ?? "a member")} a ${String(payload.role ?? "member")}`;
  }
  if (entry.eventType === "member_removed") {
    return `${entry.actorName} removed ${String(payload.memberName ?? "a member")} from the circle`;
  }
  return `${entry.actorName} updated the circle`;
}

function improvedMarkers(entry: FeedEntry) {
  const markers = entry.payload.improvedMarkers;
  if (Array.isArray(markers)) return markers.map(String);
  return [String(entry.payload.markerName ?? "Improved marker")];
}

function timeAgo(value: string) {
  const seconds = Math.round((new Date(value).getTime() - Date.now()) / 1000);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000],
    ["month", 2592000],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  for (const [unit, amount] of units) {
    if (Math.abs(seconds) >= amount) return formatter.format(Math.round(seconds / amount), unit);
  }
  return formatter.format(seconds, "second");
}
