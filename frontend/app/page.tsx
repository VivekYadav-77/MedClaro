import Link from "next/link";
import { Activity, ArrowRight, Shield, Sparkles, UploadCloud } from "lucide-react";

import { AuthContainer } from "@/components/auth/auth-forms";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* ── Navbar ────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
              <Activity className="h-5 w-5" />
            </span>
            <span className="font-display text-lg font-bold text-slate-900">MedClaro</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="#features" className="hidden text-sm font-medium text-slate-600 hover:text-slate-900 sm:block transition-colors">
              Features
            </Link>
            <Link href="#auth">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ──────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-teal-50">
        {/* Subtle decorative circle */}
        <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-brand-100/40 blur-3xl" />
        <div className="pointer-events-none absolute top-1/2 -left-20 h-64 w-64 rounded-full bg-teal-100/40 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 md:px-6 lg:grid-cols-2 lg:items-center lg:py-32">
          {/* Left: Copy */}
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
                Upload blood reports, prescriptions, and follow-up labs to get gentle explanations, trend views, and doctor-ready summaries — in your language.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="#auth">
                <Button size="lg" className="gap-2">
                  Start for free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/reports/upload">
                <Button variant="outline" size="lg">
                  See how uploads work
                </Button>
              </Link>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-500">
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

          {/* Right: Auth form */}
          <div id="auth" className="animate-fade-in">
            <AuthContainer />
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────── */}
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
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card hover:shadow-card-hover transition-shadow"
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

      {/* ── Footer ────────────────────────── */}
      <footer className="border-t border-slate-100 bg-slate-50 py-10 text-center">
        <p className="text-sm text-slate-500">
          © {new Date().getFullYear()} MedClaro. Built for calm health intelligence.
        </p>
      </footer>
    </main>
  );
}
