import { Activity, FileText, HeartPulse, ShieldCheck } from "lucide-react";
import Link from "next/link";

const hubItems = [
  { label: "Health Profile", value: "Foundation", icon: HeartPulse },
  { label: "Reports", value: "Ready for upload flow", icon: FileText },
  { label: "AI Safety", value: "Educational only", icon: ShieldCheck },
  { label: "Trends", value: "Planned", icon: Activity }
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
            <Link
              className="mt-5 inline-flex rounded-md bg-claro-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              href="/profile"
            >
              Open Profile
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
