"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Radio, Square, Volume2 } from "lucide-react";
import QRCode from "qrcode";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Report, UserProfile } from "@/lib/types";

export function EmergencyCard({
  user,
  latestReport
}: {
  user: UserProfile;
  latestReport: Report | null;
}) {
  const [broadcasting, setBroadcasting] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const broadcastingRef = useRef(false);

  const medications = useMemo(() => latestReport?.medications?.map((medication) => medication.name) ?? [], [latestReport]);
  const abnormalMarkers = useMemo(
    () => latestReport?.structuredData.filter((item) => item.flag !== "normal").map((item) => `${item.testName} ${item.value} ${item.unit}`) ?? [],
    [latestReport]
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
    QRCode.toDataURL(emergencyText, { margin: 1, width: 180 }).then(setQrDataUrl).catch(() => setQrDataUrl(null));
  }, [emergencyText]);

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

  return (
    <Card className="overflow-hidden border-red-200 bg-red-50/60 shadow-card">
      <div className="bg-gradient-to-r from-red-600 to-rose-500 px-5 py-4 text-white">
        <p className="text-xs font-semibold uppercase tracking-wider text-red-100">Emergency Card</p>
        <h2 className="mt-1 font-display text-xl font-bold">{user.name}</h2>
        <p className="mt-1 text-sm text-red-50">Lock-screen medical summary</p>
      </div>
      <div className="space-y-4 p-5">
        <div className="space-y-3 text-sm">
          <InfoBlock label="Blood type" value="Unknown" />
          <InfoBlock label="Active medications" value={medications.length ? medications.join(", ") : "None listed"} />
          <InfoBlock label="Recent abnormal markers" value={abnormalMarkers.length ? abnormalMarkers.join(", ") : "None listed"} />
        </div>
        {qrDataUrl ? (
          <div className="rounded-2xl border border-red-100 bg-white p-3 text-center shadow-sm">
            <img src={qrDataUrl} alt="Emergency medical QR code" className="mx-auto h-36 w-36 rounded-lg bg-white" />
            <p className="mt-2 text-xs font-medium text-slate-500">Scan for emergency summary</p>
          </div>
        ) : null}
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
        <p className="text-xs leading-5 text-slate-500">This card works offline once the page has loaded.</p>
      </div>
    </Card>
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
