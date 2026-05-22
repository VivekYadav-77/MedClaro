"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { LocateFixed, MessageSquareWarning, QrCode, Radio, ShieldAlert, Square, Volume2 } from "lucide-react";
import QRCode from "qrcode";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Report, UserProfile } from "@/lib/types";

export function EmergencyCard({
  user,
  reports = [],
  latestReport,
  circleId
}: {
  user: UserProfile;
  reports?: Report[];
  latestReport: Report | null;
  circleId?: string;
}) {
  const { data: session } = useSession();
  const [broadcasting, setBroadcasting] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [locationPermission, setLocationPermission] = useState<"unknown" | "granted" | "denied" | "unsupported">("unknown");
  const [sosMessage, setSosMessage] = useState<string | null>(null);
  const [shareText, setShareText] = useState<string | null>(null);
  const [accessUrl, setAccessUrl] = useState<string | null>(null);
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [sendingSos, setSendingSos] = useState(false);
  const broadcastingRef = useRef(false);

  const visibleReports = reports.length ? reports : latestReport ? [latestReport] : [];
  const medications = useMemo(() => {
    const names = visibleReports
      .flatMap((report) => report.medications ?? [])
      .map((medication) => medication.name)
      .filter(Boolean);
    return [...new Set(names)].slice(0, 12);
  }, [visibleReports]);
  const abnormalMarkers = useMemo(
    () =>
      visibleReports
        .flatMap((report) => report.structuredData.filter((item) => item.flag !== "normal"))
        .map((item) => `${item.testName} ${item.value} ${item.unit}`)
        .slice(0, 12),
    [visibleReports]
  );
  const emergencyText = useMemo(
    () => [
      `EMERGENCY MEDICAL INFO: Name: ${user.name}.`,
      "Blood type: unknown.",
      `Active medications: ${medications.length ? medications.join(", ") : "none listed"}.`,
      `Recent abnormal markers: ${abnormalMarkers.length ? abnormalMarkers.join(", ") : "none listed"}.`,
      "Contact family via MedClaro.",
    ].join(" "),
    [abnormalMarkers, medications, user.name]
  );

  useEffect(() => {
    const qrPayload = accessUrl ?? emergencyText;
    QRCode.toDataURL(qrPayload, { margin: 1, width: 180 }).then(setQrDataUrl).catch(() => setQrDataUrl(null));
  }, [accessUrl, emergencyText]);

  useEffect(() => {
    if (!("permissions" in navigator)) return;
    navigator.permissions
      ?.query({ name: "geolocation" as PermissionName })
      .then((result) => setLocationPermission(result.state === "granted" ? "granted" : result.state === "denied" ? "denied" : "unknown"))
      .catch(() => setLocationPermission("unknown"));
  }, []);

  function broadcast() {
    if (!("speechSynthesis" in window)) return;
    if (broadcasting) {
      broadcastingRef.current = false;
      window.speechSynthesis.cancel();
      setBroadcasting(false);
      return;
    }
    const speak = () => {
      if (!broadcastingRef.current) return;
      const utterance = new SpeechSynthesisUtterance(emergencyText);
      utterance.rate = 0.85;
      utterance.lang = "en-US";
      utterance.onend = () => {
        if (broadcastingRef.current) {
          window.setTimeout(speak, 700);
        } else {
          setBroadcasting(false);
        }
      };
      window.speechSynthesis.speak(utterance);
    };
    broadcastingRef.current = true;
    setBroadcasting(true);
    speak();
  }

  function requestLocation() {
    if (!("geolocation" in navigator)) {
      setLocationPermission("unsupported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationPermission("granted");
        setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
      },
      () => setLocationPermission("denied"),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  async function triggerSos() {
    if (!process.env.NEXT_PUBLIC_API_URL || !(session as any)?.accessToken || sendingSos) return;
    setSendingSos(true);
    setSosMessage(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/emergency/sos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any).accessToken}`,
        },
        body: JSON.stringify({ circleId: circleId || undefined, location: location ?? undefined }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error ?? "Could not send emergency alert.");
      setShareText(data.shareText ?? emergencyText);
      setAccessUrl(data.accessUrl ?? null);
      setRecipientCount(typeof data.recipientCount === "number" ? data.recipientCount : 0);
      setSosMessage(data.message ?? "Emergency alert prepared.");
    } catch (error) {
      setSosMessage(error instanceof Error ? error.message : "Could not send emergency alert.");
    } finally {
      setSendingSos(false);
    }
  }

  async function shareEmergencyText() {
    const text = shareText ?? emergencyText;
    if (navigator.share) {
      await navigator.share({ title: "MedClaro emergency info", text, url: accessUrl ?? undefined }).catch(() => undefined);
      return;
    }
    await navigator.clipboard?.writeText(accessUrl ? `${text}\n${accessUrl}` : text).catch(() => undefined);
    setSosMessage("Emergency text copied. Share it with your phone apps manually.");
  }

  return (
    <Card className="overflow-hidden border-red-200 bg-red-50/60 shadow-card">
      <div className="bg-red-700 px-4 py-3 text-white">
        <p className="text-xs font-semibold uppercase tracking-wider text-red-100">Emergency SOS / ICE</p>
        <h2 className="mt-1 font-display text-xl font-bold">{user.name}</h2>
        <p className="mt-1 text-sm text-red-50">Lock-screen medical summary with honest provider status</p>
      </div>
      <div className="space-y-4 p-4">
        <button
          type="button"
          onClick={() => void triggerSos()}
          disabled={sendingSos}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-red-700"
        >
          <ShieldAlert className="h-5 w-5" />
          {sendingSos ? "Sending in-app alert..." : "Emergency SOS"}
        </button>
        {sosMessage ? <p className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs leading-5 text-red-700">{sosMessage}</p> : null}
        <div className="grid gap-2 text-xs sm:grid-cols-2">
          <StatusBlock icon={LocateFixed} label="Location" value={locationPermission} action={locationPermission !== "granted" ? "Enable" : undefined} onAction={requestLocation} />
          <StatusBlock icon={MessageSquareWarning} label="Alert channel" value="In-app + manual share" />
          <StatusBlock icon={UsersIcon} label="Care recipients" value={recipientCount === null ? "Admins/caregivers" : `${recipientCount} notified`} />
          <StatusBlock icon={QrCode} label="QR scan alert" value={accessUrl ? "Logging enabled" : "Ready after SOS"} />
        </div>
        <div className="space-y-3 text-sm">
          <InfoBlock label="Blood type" value="Unknown" />
          <InfoBlock label="Active medications" value={medications.length ? medications.join(", ") : "None listed"} />
          <InfoBlock label="Recent abnormal markers" value={abnormalMarkers.length ? abnormalMarkers.join(", ") : "None listed"} />
        </div>
        {qrDataUrl ? (
          <div className="rounded-lg border border-red-100 bg-white p-3 text-center shadow-sm">
            <img src={qrDataUrl} alt="Emergency medical QR code" className="mx-auto h-36 w-36 rounded-lg bg-white" />
            <p className="mt-2 text-xs font-medium text-slate-500">{accessUrl ? "Scan logs access and shows emergency summary" : "Scan for emergency summary"}</p>
          </div>
        ) : null}
        <Button variant="outline" className="w-full gap-2 border-red-200 bg-white hover:bg-red-50" onClick={() => void shareEmergencyText()}>
          <MessageSquareWarning className="h-4 w-4" />
          Share via phone apps
        </Button>
        <Button variant={broadcasting ? "danger" : "outline"} className="w-full gap-2 border-red-200 bg-white hover:bg-red-50" onClick={broadcast}>
          {broadcasting ? <Square className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          {broadcasting ? "Stop broadcasting" : "Broadcast aloud"}
        </Button>
        {broadcasting ? (
          <p className="flex items-center justify-center gap-2 text-sm font-medium text-red-600">
            <Radio className="h-4 w-4 animate-pulse" />
            Broadcasting
          </p>
        ) : null}
        <p className="text-xs leading-5 text-slate-500">Free mode uses in-app Care Circle alerts, browser sharing, QR access logging, and offline audio.</p>
      </div>
    </Card>
  );
}

function StatusBlock({
  icon: Icon,
  label,
  value,
  action,
  onAction,
}: {
  icon: typeof LocateFixed;
  label: string;
  value: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="rounded-lg border border-red-100 bg-white p-2">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 font-semibold text-slate-600">
          <Icon className="h-3.5 w-3.5 text-red-600" />
          {label}
        </span>
        {action ? <button className="font-semibold text-red-700" onClick={onAction}>{action}</button> : null}
      </div>
      <p className="mt-1 truncate text-slate-900">{value}</p>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 leading-6 text-slate-800">{value}</p>
    </div>
  );
}

const UsersIcon = ShieldAlert;
