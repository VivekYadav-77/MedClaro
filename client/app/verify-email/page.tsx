"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Loader2, MailCheck } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email");
  const userId = searchParams.get("user_id");
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);

  const handleVerifyStub = async () => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });

      if (res.ok) {
        setVerified(true);
        setTimeout(() => router.push("/"), 2000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md space-y-6 p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-100">
          <MailCheck className="h-8 w-8 text-brand-600" />
        </div>

        <div className="space-y-2">
          <h1 className="font-display text-3xl font-bold text-slate-900">Check your inbox</h1>
          <p className="text-slate-600">
            We&apos;ve sent a verification link to{" "}
            <span className="font-semibold text-slate-900">{email || "your email"}</span>.
          </p>
        </div>

        {verified ? (
          <div className="flex items-center justify-center gap-2 rounded-xl bg-green-50 p-4 text-sm text-green-700 border border-green-100">
            <CheckCircle2 className="h-4 w-4" />
            Email verified! Redirecting to login...
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 text-xs text-amber-700 font-medium uppercase tracking-wider">
              Development only
            </div>
            <Button className="w-full gap-2" onClick={handleVerifyStub} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {loading ? "Verifying..." : "Dev: Simulate Email Verification"}
            </Button>
            <Button variant="ghost" className="w-full text-sm" onClick={() => router.push("/")}>
              Back to login
            </Button>
          </div>
        )}
      </Card>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </main>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
