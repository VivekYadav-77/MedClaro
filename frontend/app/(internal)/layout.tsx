import { ShieldAlert } from "lucide-react";
import Link from "next/link";

export default function InternalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-amber-200 bg-amber-50">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 text-amber-900">
            <ShieldAlert className="h-5 w-5" aria-hidden />
            <p className="font-semibold">Internal planning surface</p>
          </div>
          <Link className="text-sm font-semibold text-claro-blue" href="/hub">
            Return to Health Hub
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}
