"use client";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { getUserProfile } from "@/lib/api";
import { Shield, Trash2, BellOff, Save, User } from "lucide-react";

export default async function SettingsPage() {
  const user = await getUserProfile();

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">Settings</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-slate-900">
          Profile, language & privacy
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
          Language selection changes UI copy and AI explanations. Inactivity signs you out after 15 minutes.
        </p>
      </div>

      {/* Profile card */}
      <Card className="p-6 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100">
            <User className="h-5 w-5 text-brand-600" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Personal Information</h2>
            <p className="text-xs text-slate-500">Your email is stored encrypted.</p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Full name</label>
            <Input defaultValue={user.name} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Email address</label>
            <Input defaultValue={user.email} type="email" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Preferred language</label>
            <Select defaultValue={user.preferredLanguage}>
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="ta">Tamil</option>
              <option value="bn">Bengali</option>
              <option value="te">Telugu</option>
              <option value="mr">Marathi</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Biological sex</label>
            <Select defaultValue={user.biologicalSex}>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="intersex">Intersex</option>
              <option value="other">Other</option>
              <option value="undisclosed">Prefer not to say</option>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <Button className="gap-2">
            <Save className="h-4 w-4" />
            Save changes
          </Button>
          <Button variant="outline" className="gap-2">
            <BellOff className="h-4 w-4" />
            Mute nudges (30 days)
          </Button>
        </div>
      </Card>

      {/* Danger zone */}
      <Card className="p-6 space-y-4 border-red-200">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
            <Shield className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Danger Zone</h2>
            <p className="text-xs text-slate-500">This action is permanent and cannot be undone.</p>
          </div>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">
          Hard delete removes your account, all uploaded reports, structured data, and chat history from our servers permanently.
        </p>
        <Button variant="danger" className="gap-2">
          <Trash2 className="h-4 w-4" />
          Delete my account & all data
        </Button>
      </Card>
    </div>
  );
}
