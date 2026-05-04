import { CirclesClient } from "@/components/circles/circles-client";

export default function CirclesPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">Care Network</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-slate-900">Circles</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
          Invite trusted people, share report activity, and keep family health context in one place.
        </p>
      </div>
      <CirclesClient />
    </div>
  );
}
