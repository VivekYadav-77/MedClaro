import Link from "next/link";

export default function MedicalDisclaimerPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="mx-auto max-w-3xl px-6 py-12">
        <p className="text-sm font-semibold uppercase tracking-wide text-claro-mint">
          Medical Disclaimer
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-claro-ink">
          Educational Support, Not Diagnosis
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600">
          MedClaro summarizes and explains health information to help you prepare for
          qualified care. It does not diagnose, treat, or replace advice from a doctor,
          pharmacist, emergency service, or other licensed clinician.
        </p>
        <p className="mt-4 text-base leading-7 text-slate-600">
          If symptoms feel urgent or severe, seek local emergency care immediately.
        </p>
        <Link className="mt-6 inline-flex text-sm font-semibold text-claro-blue" href="/">
          Back to MedClaro
        </Link>
      </section>
    </main>
  );
}
