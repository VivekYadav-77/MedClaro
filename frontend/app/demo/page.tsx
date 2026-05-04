import Link from "next/link";
import { Activity, ArrowLeft } from "lucide-react";

import { DemoContainer } from "@/components/demo/demo-container";
import { Button } from "@/components/ui/button";

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
              <Activity className="h-5 w-5" />
            </span>
            <span className="font-display text-lg font-bold">MedClaro</span>
          </Link>
          <Link href="/">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
        </div>
      </header>
      <DemoContainer />
    </main>
  );
}
