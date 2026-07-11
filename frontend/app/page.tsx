import { Activity, Bot, FileText, HeartPulse, ShieldCheck } from "lucide-react";
import Link from "next/link";

const hubItems = [
  { label: "Health Hub", value: "Assistant ready", icon: Bot },
  { label: "Health Profile", value: "Foundation", icon: HeartPulse },
  { label: "Reports", value: "Analysis workflow", icon: FileText },
  { label: "AI Safety", value: "Educational only", icon: ShieldCheck },
  { label: "Trends", value: "Timeline ready", icon: Activity }
];

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-claro-mint">
              MedClaro
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-claro-ink">
              Personal Health Intelligence
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              A privacy-first foundation for health profiles, report analysis,
              medication intelligence, family care, and doctor-ready summaries.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                className="inline-flex rounded-md bg-claro-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                href="/hub"
              >
                Open Health Hub
              </Link>
              <Link
                className="inline-flex rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                href="/profile"
              >
                Open Profile
              </Link>
              <Link
                className="inline-flex rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                href="/documents"
              >
                Open Vault
              </Link>
              <Link
                className="inline-flex rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                href="/reports"
              >
                Analyze Reports
              </Link>
              <Link
                className="inline-flex rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                href="/trends"
              >
                View Trends
              </Link>
              <Link
                className="inline-flex rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                href="/prescriptions"
              >
                Review Prescriptions
              </Link>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {hubItems.map((item) => (
              <div
                className="rounded-md border border-slate-200 bg-slate-50 p-4"
                key={item.label}
              >
                <item.icon className="h-5 w-5 text-claro-blue" aria-hidden />
                <p className="mt-4 text-sm font-medium text-slate-500">
                  {item.label}
                </p>
                <p className="mt-1 text-base font-semibold text-claro-ink">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
