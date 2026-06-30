import Link from "next/link";
import { Suspense } from "react";
import { Activity, ArrowLeft, ShieldCheck } from "lucide-react";

import { AuthContainer } from "@/components/auth/auth-forms";

export default function LoginPage() {
  return (
    <main className="min-h-screen px-4 py-8 text-slate-900 md:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col animate-fade-in">
        <header className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
              <Activity className="h-5 w-5" />
            </span>
            <span className="font-display text-lg font-bold text-slate-900">MedClaro</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Home
          </Link>
        </header>

        <section className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_minmax(360px,448px)]">
          <div className="max-w-xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-3 py-1.5 text-xs font-semibold text-brand-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              Secure access to your health workspace
            </div>
            <div className="space-y-4">
              <h1 className="font-display text-4xl font-bold leading-tight text-slate-900 md:text-5xl">
                Sign in to continue your calm health review.
              </h1>
              <p className="text-lg leading-relaxed text-slate-600">
                Use your account or continue as a guest to upload reports, compare trends, and prepare visit-ready summaries.
              </p>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <Suspense fallback={<div className="h-[420px] w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-dialog" />}>
              <AuthContainer />
            </Suspense>
          </div>
        </section>
      </div>
    </main>
  );
}
