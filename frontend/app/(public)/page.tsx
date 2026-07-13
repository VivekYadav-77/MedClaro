import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Bot,
  CheckCircle2,
  FileText,
  HeartPulse,
  Languages,
  LockKeyhole,
  Pill,
  ShieldCheck,
  Users
} from "lucide-react";

const featureCards = [
  {
    title: "Private health profile",
    description: "Keep allergies, conditions, lifestyle context, consent, and emergency details in one guided workspace.",
    icon: HeartPulse
  },
  {
    title: "Document vault",
    description: "Upload reports, prescriptions, scans, and insurance records with metadata ready for later review.",
    icon: FileText
  },
  {
    title: "Report explanations",
    description: "Review biomarkers, health score context, food guidance, lifestyle prompts, and doctor questions.",
    icon: Activity
  },
  {
    title: "Medicine intelligence",
    description: "Turn prescriptions into schedules, safety notes, reminders, and conversation-ready summaries.",
    icon: Pill
  }
];

const workflowSteps = [
  "Create your private account",
  "Build the Personal Health Profile",
  "Upload documents into the vault",
  "Review reports, medicines, trends, and daily notes"
];

const trustItems = [
  { label: "Educational only", icon: ShieldCheck },
  { label: "Consent-led profile", icon: LockKeyhole },
  { label: "Family sharing ready", icon: Users },
  { label: "Accessible by design", icon: Languages }
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-claro-background">
      <header className="border-b border-claro-border bg-white/95">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-6 lg:px-8">
          <Link className="flex items-center gap-3" href="/">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-claro-blue text-white">
              <HeartPulse className="h-5 w-5" aria-hidden />
            </span>
            <span>
              <span className="block text-base font-semibold text-claro-ink">MedClaro</span>
              <span className="block text-xs font-medium text-slate-500">Health intelligence</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-600 md:flex" aria-label="Public navigation">
            <a className="hover:text-claro-blue" href="#features">Features</a>
            <a className="hover:text-claro-blue" href="#flow">Flow</a>
            <a className="hover:text-claro-blue" href="#safety">Safety</a>
          </nav>

          <div className="flex items-center gap-2">
            <Link className="hidden min-h-10 items-center rounded-md px-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 sm:inline-flex" href="/signin">
              Sign in
            </Link>
            <Link className="inline-flex min-h-10 items-center rounded-md bg-claro-blue px-4 text-sm font-semibold text-white hover:bg-blue-700" href="/register">
              Get started
            </Link>
          </div>
        </div>
      </header>

      <section className="border-b border-claro-border bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 lg:grid-cols-[minmax(0,0.88fr)_minmax(440px,1.12fr)] lg:items-center lg:px-8 lg:py-16">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-claro-mint">
              Personal health intelligence
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight text-claro-ink sm:text-5xl">
              Understand your health records before the next appointment.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
              MedClaro turns profiles, medical documents, lab reports, medicines,
              daily health notes, and family care into a private workspace for
              clearer questions and calmer decisions.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-claro-blue px-5 text-sm font-semibold text-white hover:bg-blue-700" href="/register">
                Create health workspace
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link className="inline-flex min-h-12 items-center justify-center rounded-md border border-slate-300 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-100" href="/signin">
                Sign in
              </Link>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {trustItems.map((item) => (
                <div className="flex min-h-11 items-center gap-3 rounded-md border border-claro-border bg-claro-muted px-3" key={item.label}>
                  <item.icon className="h-4 w-4 shrink-0 text-claro-blue" aria-hidden />
                  <span className="text-sm font-semibold text-slate-700">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-md border border-claro-border bg-white shadow-panel">
            <Image
              className="h-full w-full object-cover"
              src="/images/medclaro-hero.png"
              alt="A tablet showing a health dashboard beside lab report pages and a pill organizer"
              width={1792}
              height={1024}
              priority
            />
          </div>
        </div>
      </section>

      <section className="border-b border-claro-border bg-claro-muted" id="features">
        <div className="mx-auto max-w-6xl px-6 py-12 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-claro-mint">What it connects</p>
            <h2 className="mt-2 text-3xl font-semibold text-claro-ink">One front door for the full health flow</h2>
            <p className="mt-3 text-base leading-7 text-slate-600">
              The app is built around the tasks people repeat: collect records,
              understand them, track changes, and prepare better care conversations.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {featureCards.map((feature) => (
              <article className="rounded-md border border-claro-border bg-white p-5 shadow-panel" key={feature.title}>
                <feature.icon className="h-6 w-6 text-claro-blue" aria-hidden />
                <h3 className="mt-4 text-lg font-semibold text-claro-ink">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-claro-border bg-white" id="flow">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 lg:grid-cols-[0.8fr_1fr] lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-claro-mint">Guided workflow</p>
            <h2 className="mt-2 text-3xl font-semibold text-claro-ink">Start simple, then let each module add context.</h2>
            <p className="mt-3 text-base leading-7 text-slate-600">
              New users should not land inside a command center with no context.
              The public page now routes them toward account creation, profile
              setup, vault upload, and the Health Hub in that order.
            </p>
          </div>

          <ol className="grid gap-3">
            {workflowSteps.map((step, index) => (
              <li className="flex gap-4 rounded-md border border-claro-border bg-claro-muted p-4" key={step}>
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-white text-sm font-semibold text-claro-blue">
                  {index + 1}
                </span>
                <div>
                  <h3 className="font-semibold text-claro-ink">{step}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {index === 0
                      ? "The public CTAs now lead to register and sign in instead of exposing internal module shortcuts."
                      : index === 1
                        ? "The profile wizard collects consent and the context used across reports, medicines, and family care."
                        : index === 2
                          ? "The vault keeps source files separate from analysis so users can verify metadata first."
                          : "The Health Hub becomes the signed-in daily workspace once there is useful personal context."}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-claro-ink text-white" id="safety">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-300">Safety boundary</p>
            <h2 className="mt-2 text-3xl font-semibold">Designed to explain, not diagnose.</h2>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-200">
              MedClaro is positioned as an educational companion that organizes
              records, highlights uncertainty, and prepares questions for qualified
              care. The landing page now says that clearly before users enter the app.
            </p>
          </div>
          <div className="rounded-md border border-white/15 bg-white/10 p-5">
            <div className="flex items-center gap-3">
              <Bot className="h-6 w-6 text-emerald-300" aria-hidden />
              <h3 className="text-lg font-semibold">AI with visible context</h3>
            </div>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-200">
              {[
                "Report and prescription analysis remain separate user actions.",
                "Profile consent is collected before personal health context is saved.",
                "Family and emergency access are treated as permission-controlled workflows."
              ].map((item) => (
                <li className="flex gap-3" key={item}>
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
