"use client";

import { FormEvent, useState } from "react";
import { UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { accountsApi } from "@/lib/api";
import { useSession } from "@/lib/session";

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

export default function RegisterPage() {
  const router = useRouter();
  const { signIn } = useSession();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");

    try {
      const data = await accountsApi.register<RegisterResponse>({
        username,
        email,
        password
      });
      const token = data.token ?? data.key;
      if (!token) throw new Error("Register response did not include a token");
      signIn(token, data.user ?? { username, email });
      router.push("/profile");
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
            <button
              className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-claro-blue px-4 text-sm font-semibold text-white transition hover:bg-blue-700"
              type="submit"
              disabled={status === "loading"}
            >
              {status === "loading" ? "Creating account..." : "Create account"}
            </button>
            {status === "error" ? (
              <p className="text-sm font-medium text-claro-rose">
                Could not create account. Check required fields and backend availability.
              </p>
            ) : null}
          </div>
        </div>
      </form>
    </main>
  );
}
