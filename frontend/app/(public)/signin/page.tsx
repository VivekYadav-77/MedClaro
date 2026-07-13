"use client";

import { FormEvent, useState } from "react";
import { LogIn, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { accountsApi } from "@/lib/api";
import { useSession } from "@/lib/session";
import { SafetyNotice } from "@/components/design-system";

type LoginResponse = {
  token?: string;
  key?: string;
  user?: {
    id?: number;
    username?: string;
    email?: string;
    name?: string;
  };
};

const inputClass =
  "mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 outline-none transition focus:border-claro-blue focus:ring-2 focus:ring-blue-100";

export default function SignInPage() {
  const router = useRouter();
  const { signIn } = useSession();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");

    try {
      const data = await accountsApi.login<LoginResponse>({ username, password });
      const token = data.token ?? data.key;
      if (!token) throw new Error("Login response did not include a token");
      signIn(token, data.user ?? { username });
      router.push("/hub");
    } catch {
      setStatus("error");
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
              Sign In To Your Health Workspace
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Your session powers all MedClaro modules, including profile,
              vault, reports, medicines, family care, and accessibility.
            </p>
          </div>
          <Link className="text-sm font-semibold text-claro-blue" href="/register">
            Create account
          </Link>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[420px_1fr]">
        <form className="rounded-md border border-slate-200 bg-white p-6" onSubmit={handleSubmit}>
          <div className="flex items-center gap-2">
            <LogIn className="h-5 w-5 text-claro-blue" aria-hidden />
            <h2 className="text-lg font-semibold text-claro-ink">Account access</h2>
          </div>
          <div className="mt-5">
            <SafetyNotice title="Private workspace">
              Sign in once and MedClaro handles secure API access behind the app
              session. Health profile consent remains visible and separate.
            </SafetyNotice>
          </div>
          <div className="mt-5 space-y-4">
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
              Password
              <input
                className={inputClass}
                autoComplete="current-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            <button
              className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-claro-blue px-4 text-sm font-semibold text-white transition hover:bg-blue-700"
              type="submit"
              disabled={status === "loading"}
            >
              {status === "loading" ? "Signing in..." : "Sign in"}
            </button>
            {status === "error" ? (
              <p className="text-sm font-medium text-claro-rose">
                Could not sign in. Check your credentials and backend availability.
              </p>
            ) : null}
          </div>
        </form>

        <section className="rounded-md border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-claro-ink">
            <ShieldCheck className="h-5 w-5 text-claro-mint" aria-hidden />
            Session model
          </div>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            This first production foundation keeps the current DRF token backend but
            hides token handling behind a shared frontend session. Later OAuth or
            cookie-based auth can fit behind the same interface.
          </p>
        </section>
      </div>
    </main>
  );
}
