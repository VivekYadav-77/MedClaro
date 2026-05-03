import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles, UploadCloud } from "lucide-react";

import { GoogleSignInButton } from "@/components/layout/google-signin";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-shell px-4 py-10 text-ink">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <section className="space-y-6">
          <p className="inline-flex rounded-full bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-[#5b7686]">
            Private health intelligence
          </p>
          <div className="space-y-4">
            <h1 className="max-w-2xl font-display text-5xl leading-tight sm:text-6xl">
              Understand every report with calm, multilingual guidance.
            </h1>
            <p className="max-w-xl text-lg leading-8 text-[#355166]">
              Upload blood reports, prescriptions, and follow-up labs to get gentle explanations, trend views, doctor prep summaries, and a protected chat grounded only in your data.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex items-center gap-2">
              <GoogleSignInButton />
              <ArrowRight className="hidden h-4 w-4 text-ink sm:block" />
            </div>
            <Link href="/reports/upload">
              <Button variant="soft" size="lg" className="w-full sm:w-auto">
                See upload flow
              </Button>
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Card className="space-y-2">
              <UploadCloud className="h-5 w-5 text-sea" />
              <p className="font-semibold">Private uploads</p>
              <p className="text-sm text-[#5b7686]">Signed file access only, with strict validation on every upload.</p>
            </Card>
            <Card className="space-y-2">
              <Sparkles className="h-5 w-5 text-sea" />
              <p className="font-semibold">Layered AI help</p>
              <p className="text-sm text-[#5b7686]">Parameter, whole-report, confidence, and severity guidance in one place.</p>
            </Card>
            <Card className="space-y-2">
              <ShieldCheck className="h-5 w-5 text-sea" />
              <p className="font-semibold">Doctor-ready summaries</p>
              <p className="text-sm text-[#5b7686]">Bring clear trend notes and tailored questions to your appointment.</p>
            </Card>
          </div>
        </section>
        <Card className="space-y-5 bg-white/90 p-6">
          <div className="rounded-[28px] bg-mist p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#5b7686]">Upload → Extract → Analyze → Ready</p>
            <h2 className="mt-3 font-display text-3xl">A timeline that feels quieter than a lab portal.</h2>
            <p className="mt-3 text-sm leading-7 text-[#355166]">
              Trend bands, gentle reminders, family switching, and report-grounded chat stay centered on what changed and what is worth discussing next.
            </p>
          </div>
          <div className="space-y-3 rounded-[28px] bg-foam p-5">
            <div className="rounded-3xl bg-white p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-[#6b8292]">Attention score</p>
              <p className="mt-2 font-display text-4xl">3 / 5</p>
              <p className="mt-2 text-sm text-[#355166]">Worth discussing with your doctor soon, with an iron pattern to review together.</p>
            </div>
            <div className="rounded-3xl bg-white p-4 text-sm text-[#355166]">
              Based on your hemoglobin of 11.2 g/dL and ferritin of 18 ng/mL, the app groups those values together instead of treating them as unrelated alerts.
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
