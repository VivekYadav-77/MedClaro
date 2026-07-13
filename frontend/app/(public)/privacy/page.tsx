import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="mx-auto max-w-3xl px-6 py-12">
        <p className="text-sm font-semibold uppercase tracking-wide text-claro-mint">
          Privacy
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-claro-ink">
          You Control Your Health Workspace
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600">
          MedClaro is designed around owner-scoped health records, explicit sharing,
          and visible permissions. Documents, profile details, family access, and
          emergency shares should always show who can access what and for how long.
        </p>
        <Link className="mt-6 inline-flex text-sm font-semibold text-claro-blue" href="/">
          Back to MedClaro
        </Link>
      </section>
    </main>
  );
}
