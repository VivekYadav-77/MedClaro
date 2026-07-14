"use client";

import { FormEvent, useState } from "react";
import { ShieldCheck, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { accountsApi, ApiError } from "@/lib/api";
import { useSession } from "@/lib/session";
import { SafetyNotice } from "@/components/design-system";

type RegisterResponse = {
  token?: string;
  key?: string;
  user?: {
    id?: number;
    username?: string;
    email?: string;
  };
};

const inputClass =
  "mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 outline-none transition focus:border-claro-blue focus:ring-2 focus:ring-blue-100";

function formatApiDetails(details: unknown): string | null {
  if (!details || typeof details !== "object") return null;

  const messages = Object.entries(details)
    .flatMap(([field, value]) => {
      if (Array.isArray(value)) {
        return value.map((message) => `${field}: ${String(message)}`);
      }
      return [`${field}: ${String(value)}`];
    })
    .filter(Boolean);

  return messages.length ? messages.join(" ") : null;
}

export default function RegisterPage() {
  const router = useRouter();
  const { signIn } = useSession();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirmPassword) {
      setStatus("error");
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setStatus("error");
      setError("Password must be at least 8 characters.");
      return;
    }
    setStatus("loading");
    setError("");

    try {
      const data = await accountsApi.register<RegisterResponse>({
        username,
        email,
        first_name: firstName,
        last_name: lastName,
        password
      });
      const token = data.token ?? data.key;
      if (!token) throw new Error("Register response did not include a token");
      signIn(token, data.user ?? { username, email });
      router.push("/profile");
    } catch (caughtError) {
      setStatus("error");
      const apiMessage =
        caughtError instanceof ApiError ? formatApiDetails(caughtError.details) : null;
      setError(
        apiMessage ??
          "Could not create account. Check required fields and backend availability."
      );
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-6 py-10 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-claro-mint">
              MedClaro
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-claro-ink">
              Create Your Health Workspace
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Start with an account, then build the Personal Health Profile that
              powers reports, medicines, trends, and family care.
            </p>
          </div>
          <Link className="text-sm font-semibold text-claro-blue" href="/signin">
            Already have an account?
          </Link>
        </div>
      </section>

      <form className="mx-auto max-w-md px-6 py-8" onSubmit={handleSubmit}>
        <div className="rounded-md border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-claro-blue" aria-hidden />
            <h2 className="text-lg font-semibold text-claro-ink">Account details</h2>
          </div>
          <SafetyNotice title="What happens next">
            After account creation, MedClaro takes you straight to the guided Personal
            Health Profile. You can skip optional health details and update them later.
          </SafetyNotice>
          <div className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block font-medium text-slate-700">
                First name
                <input
                  className={inputClass}
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                />
              </label>
              <label className="block font-medium text-slate-700">
                Last name
                <input
                  className={inputClass}
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                />
              </label>
            </div>
            <label className="block font-medium text-slate-700">
              Username
              <input
                className={inputClass}
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
            </label>
            <label className="block font-medium text-slate-700">
              Email
              <input
                className={inputClass}
                autoComplete="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <label className="block font-medium text-slate-700">
              Password
              <input
                className={inputClass}
                autoComplete="new-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            <label className="block font-medium text-slate-700">
              Confirm password
              <input
                className={inputClass}
                autoComplete="new-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </label>
            <button
              className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-claro-blue px-4 text-sm font-semibold text-white transition hover:bg-blue-700"
              type="submit"
              disabled={status === "loading"}
            >
              {status === "loading" ? "Creating account..." : "Create account"}
            </button>
            {status === "error" ? (
              <p className="text-sm font-medium text-claro-rose">
                {error}
              </p>
            ) : null}
          </div>
          <div className="mt-5 flex items-center gap-2 text-sm text-slate-600">
            <ShieldCheck className="h-4 w-4 text-claro-mint" aria-hidden />
            Profile consent is handled separately during onboarding.
          </div>
        </div>
      </form>
    </main>
  );
}
