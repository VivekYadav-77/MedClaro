import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { getUserProfile } from "@/lib/api";

export default async function SettingsPage() {
  const user = await getUserProfile();

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#5b7686]">Settings</p>
        <h1 className="font-display text-4xl text-ink">Profile, language, reminders, and privacy.</h1>
        <p className="max-w-3xl text-sm leading-7 text-[#355166]">
          Language selection changes UI copy and AI explanations. Inactivity signs you out after 15 minutes, and hard delete removes stored reports and account data.
        </p>
      </Card>
      <Card className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-ink">Name</label>
            <Input defaultValue={user.name} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-ink">Email</label>
            <Input defaultValue={user.email} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-ink">Preferred language</label>
            <Select defaultValue={user.preferredLanguage}>
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="ta">Tamil</option>
              <option value="bn">Bengali</option>
              <option value="te">Telugu</option>
              <option value="mr">Marathi</option>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-ink">Biological sex</label>
            <Select defaultValue={user.biologicalSex}>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="intersex">Intersex</option>
              <option value="other">Other</option>
              <option value="undisclosed">Prefer not to say</option>
            </Select>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button>Save profile</Button>
          <Button variant="soft">Mute nudges for 30 days</Button>
          <Button variant="outline">Hard delete account</Button>
        </div>
      </Card>
    </div>
  );
}
