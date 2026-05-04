import Link from "next/link";
import { Activity, ArrowRight, CheckCircle2, FileText, Shield, Sparkles, UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
              <Activity className="h-5 w-5" />
            </span>
            <span className="font-display text-lg font-bold text-slate-900">MedClaro</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="#features" className="hidden text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 sm:block">
              Features
            </Link>
            <Link href="/login">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-teal-50">
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 md:px-6 lg:grid-cols-2 lg:items-center lg:py-32">
          <div className="space-y-8 animate-slide-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700">
              <Shield className="h-3.5 w-3.5" />
              Privacy-first health intelligence
            </div>
            <div className="space-y-4">
              <h1 className="font-display text-5xl font-bold leading-tight tracking-tight text-slate-900 lg:text-6xl">
                Understand every<br />
                <span className="text-brand-600">health report</span> with<br />
                calm AI guidance.
              </h1>
              <p className="max-w-xl text-lg leading-relaxed text-slate-600">
                Upload blood reports, prescriptions, and follow-up labs to get gentle explanations, trend views, and doctor-ready summaries - in your language.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/login">
                <Button size="lg" className="gap-2">
                  Start for free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button variant="outline" size="lg">
                  See how uploads work
                </Button>
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                No credit card required
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Private & encrypted
              </span>
            </div>
          </div>

          <div className="animate-fade-in">
            <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-dialog backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">Latest analysis</p>
                  <h2 className="mt-1 font-display text-2xl font-bold text-slate-900">Blood work summary</h2>
                </div>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-100 text-teal-600">
                  <FileText className="h-5 w-5" />
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ["Hemoglobin", "13.8", "Normal"],
                  ["Vitamin D", "21", "Review"],
                  ["HbA1c", "5.4", "Stable"],
                ].map(([label, value, status]) => (
                  <div key={label} className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-medium text-slate-500">{label}</p>
                    <p className="mt-2 font-display text-2xl font-bold text-slate-900">{value}</p>
                    <p className="mt-1 text-xs font-semibold text-brand-600">{status}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <Sparkles className="h-4 w-4 text-brand-600" />
                  Doctor-ready notes
                </div>
                <div className="space-y-2">
                  {[
                    "Track Vitamin D again after supplementation.",
                    "Glucose markers look steady versus last report.",
                    "Share the trend view before your next visit.",
                  ].map((item) => (
                    <div key={item} className="flex gap-2 text-sm text-slate-600">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-teal-600" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-14 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">Why MedClaro</p>
            <h2 className="mt-3 font-display text-4xl font-bold text-slate-900">Everything your health data deserves</h2>
            <p className="mt-4 text-slate-600">Built around your privacy. Designed to be calming, not alarming.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: UploadCloud,
                color: "brand",
                title: "Private uploads",
                body: "Files are stored behind signed access only, with true MIME-type validation and 10MB limits enforced server-side.",
              },
              {
                icon: Sparkles,
                color: "teal",
                title: "Layered AI analysis",
                body: "Parameter-level confidence, holistic summary, attention scores, and multilingual doctor-ready summaries in one flow.",
              },
              {
                icon: Activity,
                color: "brand",
                title: "Trend intelligence",
                body: "Track normalized parameters across reports. Spot slow drifts before they become problems.",
              },
            ].map(({ icon: Icon, color, title, body }) => (
              <div
                key={title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card transition-shadow hover:shadow-card-hover"
              >
                <span
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${
                    color === "teal" ? "bg-teal-100 text-teal-600" : "bg-brand-100 text-brand-600"
                  }`}
                >
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-4 font-display text-xl font-semibold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-100 bg-slate-50 py-10 text-center">
        <p className="text-sm text-slate-500">
          (c) {new Date().getFullYear()} MedClaro. Built for calm health intelligence.
        </p>
      </footer>
    </main>
  );
}
