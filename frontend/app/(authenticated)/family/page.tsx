"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CalendarClock,
  Check,
  Clipboard,
  FileHeart,
  Loader2,
  Printer,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Stethoscope,
  Trash2,
  UserPlus,
  Users,
  X
} from "lucide-react";
import {
  ConfirmDialog,
  FormField,
  InlineValidation,
  PageHeader,
  PermissionNotice,
  SafetyNotice,
  SectionHeader,
  SegmentedControl,
  StatusBadge,
  SuccessLine
} from "@/components/design-system";
import { EmptyState, LoadingState, UnauthorizedState } from "@/components/app-states";
import { API_URL, apiGet, apiJson } from "@/lib/api";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/ui";

type PermissionKey =
  | "profile"
  | "reports"
  | "trends"
  | "medications"
  | "symptoms"
  | "journal"
  | "doctor_summary"
  | "emergency_profile";

type PermissionGrant = {
  id: number;
  permission: PermissionKey;
  is_allowed: boolean;
  expires_at: string | null;
  created_at: string;
};

type Membership = {
  id: number;
  display_name: string;
  email: string;
  role: string;
  status: string;
  accepted_at: string | null;
  revoked_at: string | null;
  created_at: string;
  permission_grants: PermissionGrant[];
};

type Circle = {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  memberships: Membership[];
};

type AuditEvent = {
  id: number;
  action: string;
  summary: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

type DoctorSummary = {
  id: number;
  title: string;
  summary_payload: Record<string, unknown>;
  questions_for_doctor: string[];
  model_name: string;
  prompt_version: string;
  generated_at: string;
};

type EmergencyShare = {
  id: number;
  label: string;
  token: string;
  qr_payload: Record<string, unknown>;
  profile_payload: Record<string, unknown>;
  is_active: boolean;
  is_expired: boolean;
  expires_at: string;
  last_accessed_at: string | null;
  created_at: string;
};

const inputClass =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 outline-none transition focus:border-claro-blue focus:ring-2 focus:ring-blue-100";

const permissionColumns: Array<{ key: PermissionKey; label: string }> = [
  { key: "profile", label: "Profile" },
  { key: "reports", label: "Reports" },
  { key: "trends", label: "Trends" },
  { key: "medications", label: "Medications" },
  { key: "symptoms", label: "Symptoms" },
  { key: "journal", label: "Journal" },
  { key: "doctor_summary", label: "Doctor Summary" },
  { key: "emergency_profile", label: "Emergency Profile" }
];

const roleOptions = [
  { value: "parent", label: "Parent" },
  { value: "child", label: "Child" },
  { value: "doctor", label: "Doctor" },
  { value: "caregiver", label: "Caregiver" },
  { value: "emergency_contact", label: "Emergency Contact" }
];

export default function FamilyPage() {
  const router = useRouter();
  const { token, isReady, isSignedIn } = useSession();
  const [circles, setCircles] = useState<Circle[]>([]);
  const [selectedCircleId, setSelectedCircleId] = useState<number | null>(null);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [summaries, setSummaries] = useState<DoctorSummary[]>([]);
  const [shares, setShares] = useState<EmergencyShare[]>([]);
  const [view, setView] = useState("family");
  const [circleName, setCircleName] = useState("");
  const [circleDescription, setCircleDescription] = useState("Trusted care circle");
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("caregiver");
  const [inviteExpiry, setInviteExpiry] = useState(14);
  const [shareHours, setShareHours] = useState(24);
  const [selectedSummaryId, setSelectedSummaryId] = useState<number | null>(null);
  const [memberToRevoke, setMemberToRevoke] = useState<Membership | null>(null);
  const [shareToRevoke, setShareToRevoke] = useState<EmergencyShare | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "saving" | "loaded" | "error">("loading");
  const [message, setMessage] = useState("");

  const selectedCircle = useMemo(
    () => circles.find((circle) => circle.id === selectedCircleId) ?? circles[0] ?? null,
    [circles, selectedCircleId]
  );
  const selectedSummary = useMemo(
    () => summaries.find((summary) => summary.id === selectedSummaryId) ?? summaries[0] ?? null,
    [summaries, selectedSummaryId]
  );
  const activeShare = useMemo(
    () => shares.find((share) => share.is_active && !share.is_expired) ?? shares[0] ?? null,
    [shares]
  );

  useEffect(() => {
    if (!isReady) return;
    if (!isSignedIn) {
      setStatus("idle");
      return;
    }
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, isSignedIn]);

  useEffect(() => {
    if (!selectedCircle || !token) return;
    loadAudit(selectedCircle.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCircle?.id, token]);

  async function loadAll() {
    setStatus("loading");
    setMessage("");
    try {
      const [circleData, summaryData, shareData] = await Promise.all([
        apiGet<Circle[]>("/family-care/circles/", token),
        apiGet<DoctorSummary[]>("/family-care/doctor-summaries/", token),
        apiGet<EmergencyShare[]>("/family-care/emergency-shares/", token)
      ]);
      setCircles(circleData);
      setSelectedCircleId((current) => current ?? circleData[0]?.id ?? null);
      setSummaries(summaryData);
      setSelectedSummaryId((current) => current ?? summaryData[0]?.id ?? null);
      setShares(shareData);
      setStatus("loaded");
    } catch {
      setStatus("error");
      setMessage("Could not load family care data. Check your session and try again.");
    }
  }

  async function loadAudit(circleId: number) {
    try {
      const events = await apiGet<AuditEvent[]>(`/family-care/circles/${circleId}/audit/`, token);
      setAuditEvents(events);
    } catch {
      setAuditEvents([]);
    }
  }

  async function createCircle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setMessage("");
    try {
      const circle = await apiJson<Circle>("/family-care/circles/", {
        method: "POST",
        token,
        body: {
          name: circleName.trim(),
          description: circleDescription.trim()
        }
      });
      setCircleName("");
      setSelectedCircleId(circle.id);
      await loadAll();
      setMessage("Care circle created with owner permissions visible in the matrix.");
    } catch {
      setStatus("error");
      setMessage("Could not create the care circle. Add a name and try again.");
    }
  }

  async function inviteMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCircle) return;
    setStatus("saving");
    setMessage("");
    try {
      await apiJson(`/family-care/circles/${selectedCircle.id}/invite/`, {
        method: "POST",
        token,
        body: {
          display_name: inviteName.trim(),
          email: inviteEmail.trim(),
          role: inviteRole,
          expires_in_days: inviteExpiry
        }
      });
      setInviteName("");
      setInviteEmail("");
      await loadAll();
      setMessage("Invitation created. Default permissions are shown below for review.");
    } catch {
      setStatus("error");
      setMessage("Could not invite that member. Check the name, email, and selected circle.");
    }
  }

  async function revokeMember() {
    if (!selectedCircle || !memberToRevoke) return;
    setStatus("saving");
    setMessage("");
    try {
      await apiJson<null>(`/family-care/circles/${selectedCircle.id}/members/${memberToRevoke.id}/revoke/`, {
        method: "POST",
        token
      });
      setMemberToRevoke(null);
      await loadAll();
      setMessage("Member access revoked and permissions turned off.");
    } catch {
      setStatus("error");
      setMessage("Could not revoke member access. Refresh and try again.");
    }
  }

  async function generateDoctorSummary() {
    setStatus("saving");
    setMessage("");
    try {
      const summary = await apiJson<DoctorSummary>("/family-care/doctor-summaries/", {
        method: "POST",
        token,
        body: {}
      });
      await loadAll();
      setSelectedSummaryId(summary.id);
      setView("doctor");
      setMessage("Doctor summary generated from profile, reports, medicines, trends, symptoms, and journal context.");
    } catch {
      setStatus("error");
      setMessage("Could not generate a doctor summary. Add more health context or try again.");
    }
  }

  async function createEmergencyShare() {
    setStatus("saving");
    setMessage("");
    try {
      await apiJson<EmergencyShare>("/family-care/emergency-shares/", {
        method: "POST",
        token,
        body: { expires_in_hours: shareHours }
      });
      await loadAll();
      setView("emergency");
      setMessage("Emergency share created. Anyone with the link can view it until it expires or is revoked.");
    } catch {
      setStatus("error");
      setMessage("Could not create the emergency share. Review the expiry window and try again.");
    }
  }

  async function revokeShare() {
    if (!shareToRevoke) return;
    setStatus("saving");
    setMessage("");
    try {
      await apiJson<EmergencyShare>(`/family-care/emergency-shares/${shareToRevoke.token}/revoke/`, {
        method: "POST",
        token
      });
      setShareToRevoke(null);
      await loadAll();
      setMessage("Emergency share revoked.");
    } catch {
      setStatus("error");
      setMessage("Could not revoke the emergency share. Refresh and try again.");
    }
  }

  if (!isReady || status === "loading") {
    return (
      <main className="min-h-screen bg-claro-background p-6">
        <LoadingState title="Loading family care" />
      </main>
    );
  }

  if (!isSignedIn) {
    return (
      <main className="min-h-screen bg-claro-background p-6">
        <UnauthorizedState
          action={
            <button className="min-h-11 rounded-md bg-claro-blue px-4 text-sm font-semibold text-white" type="button" onClick={() => router.push("/signin")}>
              Sign in
            </button>
          }
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-claro-background">
      <PageHeader
        eyebrow="Family, Doctor, Emergency"
        title="Permission-First Care Sharing"
        description="Coordinate care circles, preview doctor-ready summaries, and create time-limited emergency access with clear expiry and revocation controls."
        actions={
          <button className="inline-flex min-h-11 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700" type="button" onClick={loadAll}>
            <RefreshCw className="h-4 w-4" aria-hidden />
            Refresh
          </button>
        }
        notice={
          <SafetyNotice title="Public emergency link warning" tone="attention">
            Emergency shares are public to anyone with the link until the expiry time or until you revoke them.
          </SafetyNotice>
        }
      />

      <div className="mx-auto max-w-6xl px-6 py-6 lg:px-8">
        <SegmentedControl
          label="Family care mode"
          options={[
            { value: "family", label: "Family Care" },
            { value: "doctor", label: "Doctor Mode" },
            { value: "emergency", label: "Emergency Mode" }
          ]}
          value={view}
          onChange={setView}
        />
        {status === "error" ? <InlineValidation>{message}</InlineValidation> : null}
        {message && status === "loaded" ? <SuccessLine>{message}</SuccessLine> : null}
      </div>

      {view === "family" ? (
        <FamilyCareWorkspace
          auditEvents={auditEvents}
          circles={circles}
          circleDescription={circleDescription}
          circleName={circleName}
          inviteEmail={inviteEmail}
          inviteExpiry={inviteExpiry}
          inviteName={inviteName}
          inviteRole={inviteRole}
          selectedCircle={selectedCircle}
          selectedCircleId={selectedCircle?.id ?? null}
          status={status}
          onCircleDescriptionChange={setCircleDescription}
          onCircleNameChange={setCircleName}
          onCircleSelect={setSelectedCircleId}
          onCreateCircle={createCircle}
          onInviteEmailChange={setInviteEmail}
          onInviteExpiryChange={setInviteExpiry}
          onInviteNameChange={setInviteName}
          onInviteRoleChange={setInviteRole}
          onInviteSubmit={inviteMember}
          onRevokeMember={setMemberToRevoke}
        />
      ) : null}

      {view === "doctor" ? (
        <DoctorWorkspace
          selectedSummary={selectedSummary}
          summaries={summaries}
          status={status}
          onGenerate={generateDoctorSummary}
          onPrint={() => window.print()}
          onSummarySelect={setSelectedSummaryId}
        />
      ) : null}

      {view === "emergency" ? (
        <EmergencyWorkspace
          activeShare={activeShare}
          shareHours={shareHours}
          shares={shares}
          status={status}
          onCreateShare={createEmergencyShare}
          onPrint={() => window.print()}
          onRevokeShare={setShareToRevoke}
          onShareHoursChange={setShareHours}
        />
      ) : null}

      <ConfirmDialog
        title="Revoke member access?"
        message={`This will turn off all permissions for ${memberToRevoke?.display_name ?? "this member"} and mark the membership revoked.`}
        open={Boolean(memberToRevoke)}
        onCancel={() => setMemberToRevoke(null)}
        onConfirm={revokeMember}
        confirmLabel="Revoke access"
      />
      <RevokeShareDialog
        share={shareToRevoke}
        onCancel={() => setShareToRevoke(null)}
        onConfirm={revokeShare}
      />
    </main>
  );
}

function FamilyCareWorkspace({
  auditEvents,
  circles,
  circleDescription,
  circleName,
  inviteEmail,
  inviteExpiry,
  inviteName,
  inviteRole,
  selectedCircle,
  selectedCircleId,
  status,
  onCircleDescriptionChange,
  onCircleNameChange,
  onCircleSelect,
  onCreateCircle,
  onInviteEmailChange,
  onInviteExpiryChange,
  onInviteNameChange,
  onInviteRoleChange,
  onInviteSubmit,
  onRevokeMember
}: {
  auditEvents: AuditEvent[];
  circles: Circle[];
  circleDescription: string;
  circleName: string;
  inviteEmail: string;
  inviteExpiry: number;
  inviteName: string;
  inviteRole: string;
  selectedCircle: Circle | null;
  selectedCircleId: number | null;
  status: string;
  onCircleDescriptionChange: (value: string) => void;
  onCircleNameChange: (value: string) => void;
  onCircleSelect: (value: number) => void;
  onCreateCircle: (event: FormEvent<HTMLFormElement>) => void;
  onInviteEmailChange: (value: string) => void;
  onInviteExpiryChange: (value: number) => void;
  onInviteNameChange: (value: string) => void;
  onInviteRoleChange: (value: string) => void;
  onInviteSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onRevokeMember: (member: Membership) => void;
}) {
  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-6 pb-8 lg:grid-cols-[340px_minmax(0,1fr)] lg:px-8">
      <aside className="space-y-6">
        <CareCircleList circles={circles} selectedCircleId={selectedCircleId} onSelect={onCircleSelect} />
        <form className="rounded-md border border-claro-border bg-white p-5 shadow-panel" onSubmit={onCreateCircle}>
          <SectionHeader icon={Users} title="Create Circle" description="A circle starts with owner permissions and can receive invited members." />
          <div className="mt-5 space-y-4">
            <FormField label="Circle name">
              <input className={inputClass} value={circleName} onChange={(event) => onCircleNameChange(event.target.value)} required />
            </FormField>
            <FormField label="Description">
              <textarea className={inputClass} rows={3} value={circleDescription} onChange={(event) => onCircleDescriptionChange(event.target.value)} />
            </FormField>
            <button className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-claro-blue px-4 text-sm font-semibold text-white disabled:opacity-70" type="submit" disabled={status === "saving"}>
              {status === "saving" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Users className="h-4 w-4" aria-hidden />}
              Create circle
            </button>
          </div>
        </form>
        <InviteMemberForm
          disabled={!selectedCircle || status === "saving"}
          email={inviteEmail}
          expiry={inviteExpiry}
          name={inviteName}
          role={inviteRole}
          onEmailChange={onInviteEmailChange}
          onExpiryChange={onInviteExpiryChange}
          onNameChange={onInviteNameChange}
          onRoleChange={onInviteRoleChange}
          onSubmit={onInviteSubmit}
        />
      </aside>

      <section className="space-y-6">
        <PermissionNotice title="Actual permissions are visible">
          Role presets only set defaults. Review each allowed area, expiry, and status before relying on a shared care workflow.
        </PermissionNotice>
        {selectedCircle ? (
          <>
            <section className="rounded-md border border-claro-border bg-white p-5 shadow-panel">
              <SectionHeader
                icon={ShieldCheck}
                title={`${selectedCircle.name} Permissions`}
                description={`${selectedCircle.memberships.length} member(s), updated ${formatDateTime(selectedCircle.updated_at)}.`}
              />
              <PermissionMatrix members={selectedCircle.memberships} onRevokeMember={onRevokeMember} />
            </section>
            <AccessAuditList events={auditEvents} />
          </>
        ) : (
          <EmptyState title="No care circle yet" message="Create a circle to define family roles, permissions, invitations, and audit history." />
        )}
      </section>
    </div>
  );
}

function CareCircleList({
  circles,
  selectedCircleId,
  onSelect
}: {
  circles: Circle[];
  selectedCircleId: number | null;
  onSelect: (id: number) => void;
}) {
  return (
    <section className="rounded-md border border-claro-border bg-white p-5 shadow-panel">
      <SectionHeader icon={Users} title="Care Circles" description="Select a circle to inspect members and exact permissions." />
      <div className="mt-4 space-y-3">
        {circles.length ? (
          circles.map((circle) => {
            const activeMembers = circle.memberships.filter((member) => member.status === "active").length;
            return (
              <button
                className={cn(
                  "w-full rounded-md border p-4 text-left transition",
                  selectedCircleId === circle.id ? "border-claro-blue bg-blue-50" : "border-claro-border bg-white hover:bg-slate-50"
                )}
                key={circle.id}
                type="button"
                onClick={() => onSelect(circle.id)}
              >
                <span className="block font-semibold text-claro-ink">{circle.name}</span>
                <span className="mt-1 block text-sm leading-6 text-slate-600">{circle.description || "No description added."}</span>
                <span className="mt-3 flex flex-wrap gap-2">
                  <StatusBadge tone="info">{circle.memberships.length} total</StatusBadge>
                  <StatusBadge tone={activeMembers ? "success" : "neutral"}>{activeMembers} active</StatusBadge>
                </span>
              </button>
            );
          })
        ) : (
          <EmptyState title="No circles" message="Create the first trusted care circle to begin sharing." />
        )}
      </div>
    </section>
  );
}

function MemberRoleBadge({ role, status }: { role: string; status: string }) {
  const statusTone = status === "active" ? "success" : status === "revoked" ? "risk" : "attention";
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <StatusBadge tone="info">{role.replaceAll("_", " ")}</StatusBadge>
      <StatusBadge tone={statusTone}>{status}</StatusBadge>
    </span>
  );
}

function PermissionMatrix({
  members,
  onRevokeMember
}: {
  members: Membership[];
  onRevokeMember: (member: Membership) => void;
}) {
  return (
    <div className="mt-5">
      <div className="hidden overflow-x-auto lg:block">
        <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 border-b border-claro-border bg-white px-3 py-3 font-semibold text-claro-ink">Member</th>
              {permissionColumns.map((column) => (
                <th className="border-b border-claro-border px-3 py-3 font-semibold text-claro-ink" key={column.key}>
                  {column.label}
                </th>
              ))}
              <th className="border-b border-claro-border px-3 py-3 font-semibold text-claro-ink">Action</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id}>
                <td className="sticky left-0 z-10 border-b border-claro-border bg-white px-3 py-4 align-top">
                  <p className="font-semibold text-claro-ink">{member.display_name}</p>
                  <p className="mt-1 text-xs text-slate-500">{member.email || "No email"}</p>
                  <div className="mt-2">
                    <MemberRoleBadge role={member.role} status={member.status} />
                  </div>
                </td>
                {permissionColumns.map((column) => (
                  <td className="min-w-[150px] border-b border-claro-border px-3 py-4 align-top" key={column.key}>
                    <PermissionCell grant={findGrant(member, column.key)} />
                  </td>
                ))}
                <td className="border-b border-claro-border px-3 py-4 align-top">
                  <button
                    className="inline-flex min-h-10 items-center gap-2 rounded-md border border-rose-200 px-3 text-sm font-semibold text-claro-rose disabled:opacity-50"
                    type="button"
                    disabled={member.role === "owner" || member.status === "revoked"}
                    onClick={() => onRevokeMember(member)}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                    Revoke
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-4 lg:hidden">
        {members.map((member) => (
          <article className="rounded-md border border-claro-border p-4" key={member.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-claro-ink">{member.display_name}</h3>
                <p className="mt-1 text-sm text-slate-600">{member.email || "No email"}</p>
              </div>
              <MemberRoleBadge role={member.role} status={member.status} />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {permissionColumns.map((column) => (
                <div className="rounded-md bg-claro-muted p-3" key={column.key}>
                  <p className="text-sm font-semibold text-claro-ink">{column.label}</p>
                  <PermissionCell grant={findGrant(member, column.key)} />
                </div>
              ))}
            </div>
            <button
              className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-md border border-rose-200 px-3 text-sm font-semibold text-claro-rose disabled:opacity-50"
              type="button"
              disabled={member.role === "owner" || member.status === "revoked"}
              onClick={() => onRevokeMember(member)}
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              Revoke access
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}

function PermissionCell({ grant }: { grant?: PermissionGrant }) {
  if (!grant) {
    return (
      <div className="space-y-1">
        <StatusBadge tone="neutral">
          <X className="mr-1 h-3.5 w-3.5" aria-hidden />
          Not allowed
        </StatusBadge>
        <p className="text-xs leading-5 text-slate-500">No grant recorded.</p>
      </div>
    );
  }
  return (
    <div className="space-y-1">
      <StatusBadge tone={grant.is_allowed ? "success" : "neutral"}>
        {grant.is_allowed ? <Check className="mr-1 h-3.5 w-3.5" aria-hidden /> : <X className="mr-1 h-3.5 w-3.5" aria-hidden />}
        {grant.is_allowed ? "Allowed" : "Not allowed"}
      </StatusBadge>
      <p className="text-xs leading-5 text-slate-500">Granted by owner</p>
      <p className="text-xs leading-5 text-slate-500">Changed {formatDateTime(grant.created_at)}</p>
      <p className="text-xs leading-5 text-slate-500">
        {grant.expires_at ? `Expires ${formatDateTime(grant.expires_at)} (${relativeTime(grant.expires_at)})` : "No expiry"}
      </p>
    </div>
  );
}

function InviteMemberForm({
  disabled,
  email,
  expiry,
  name,
  role,
  onEmailChange,
  onExpiryChange,
  onNameChange,
  onRoleChange,
  onSubmit
}: {
  disabled: boolean;
  email: string;
  expiry: number;
  name: string;
  role: string;
  onEmailChange: (value: string) => void;
  onExpiryChange: (value: number) => void;
  onNameChange: (value: string) => void;
  onRoleChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="rounded-md border border-claro-border bg-white p-5 shadow-panel" onSubmit={onSubmit}>
      <SectionHeader icon={UserPlus} title="Invite Member" description="Invitations expire, and role defaults remain reviewable in the permission matrix." />
      <div className="mt-5 space-y-4">
        <FormField label="Display name">
          <input className={inputClass} value={name} onChange={(event) => onNameChange(event.target.value)} required />
        </FormField>
        <FormField label="Email">
          <input className={inputClass} type="email" value={email} onChange={(event) => onEmailChange(event.target.value)} />
        </FormField>
        <FormField label="Role preset">
          <select className={inputClass} value={role} onChange={(event) => onRoleChange(event.target.value)}>
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label={`Invite expiry: ${expiry} days`}>
          <input className="w-full accent-claro-blue" min={1} max={90} type="range" value={expiry} onChange={(event) => onExpiryChange(Number(event.target.value))} />
        </FormField>
        <button className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-claro-blue px-4 text-sm font-semibold text-white disabled:opacity-70" type="submit" disabled={disabled}>
          <UserPlus className="h-4 w-4" aria-hidden />
          Send invite
        </button>
      </div>
    </form>
  );
}

function AccessAuditList({ events }: { events: AuditEvent[] }) {
  return (
    <section className="rounded-md border border-claro-border bg-white p-5 shadow-panel">
      <SectionHeader icon={CalendarClock} title="Recent Access And Audit" description="Sensitive changes should leave a plain-language trail." />
      <div className="mt-4 space-y-3">
        {events.length ? (
          events.map((event) => (
            <article className="rounded-md border border-claro-border p-4" key={event.id}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-semibold text-claro-ink">{event.action.replaceAll("_", " ")}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{event.summary || "Access event recorded."}</p>
                </div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{formatDateTime(event.created_at)}</p>
              </div>
            </article>
          ))
        ) : (
          <EmptyState title="No audit events loaded" message="Create a circle, invite a member, or revoke access to populate this log." />
        )}
      </div>
    </section>
  );
}

function DoctorWorkspace({
  selectedSummary,
  summaries,
  status,
  onGenerate,
  onPrint,
  onSummarySelect
}: {
  selectedSummary: DoctorSummary | null;
  summaries: DoctorSummary[];
  status: string;
  onGenerate: () => void;
  onPrint: () => void;
  onSummarySelect: (id: number) => void;
}) {
  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-6 pb-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8">
      <section className="space-y-6">
        <DoctorSummaryPreview summary={selectedSummary} />
      </section>
      <aside className="space-y-6">
        <section className="rounded-md border border-claro-border bg-white p-5 shadow-panel">
          <SectionHeader icon={Stethoscope} title="Doctor Mode" description="Generate a structured preview with copy-friendly sections." />
          <div className="mt-5 flex flex-col gap-3">
            <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-claro-blue px-4 text-sm font-semibold text-white disabled:opacity-70" type="button" onClick={onGenerate} disabled={status === "saving"}>
              {status === "saving" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <FileHeart className="h-4 w-4" aria-hidden />}
              Generate summary
            </button>
            <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700" type="button" onClick={onPrint}>
              <Printer className="h-4 w-4" aria-hidden />
              Print
            </button>
            <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-500" type="button" disabled>
              <Clipboard className="h-4 w-4" aria-hidden />
              PDF export later
            </button>
          </div>
        </section>
        <section className="rounded-md border border-claro-border bg-white p-5 shadow-panel">
          <SectionHeader title="Saved Summaries" description="Select a generated summary to preview." />
          <div className="mt-4 space-y-2">
            {summaries.length ? (
              summaries.map((summary) => (
                <button className="w-full rounded-md border border-claro-border p-3 text-left hover:bg-slate-50" key={summary.id} type="button" onClick={() => onSummarySelect(summary.id)}>
                  <span className="block font-semibold text-claro-ink">{summary.title}</span>
                  <span className="mt-1 block text-sm text-slate-600">{formatDateTime(summary.generated_at)}</span>
                </button>
              ))
            ) : (
              <EmptyState title="No summaries yet" message="Generate a doctor summary to preview structured care context." />
            )}
          </div>
        </section>
      </aside>
    </div>
  );
}

function DoctorSummaryPreview({ summary }: { summary: DoctorSummary | null }) {
  const payload = summary?.summary_payload ?? {};
  const sections = [
    { title: "Patient Identity", value: payload.patient_identity },
    { title: "Allergies", value: payload.allergies },
    { title: "Known Conditions", value: payload.known_conditions },
    { title: "Current Medicines", value: payload.current_medicines },
    { title: "Recent Reports", value: payload.recent_reports },
    { title: "Trends And Risk Factors", value: { important_biomarker_trends: payload.important_biomarker_trends, risk_factors: payload.risk_factors } },
    { title: "Symptoms And Journal", value: { symptoms: payload.symptoms, journal_patterns: payload.journal_patterns } },
    { title: "Questions For Doctor", value: summary?.questions_for_doctor ?? [] }
  ];

  if (!summary) {
    return <EmptyState title="No doctor summary selected" message="Generate a summary to see patient basics, medicines, reports, trends, symptoms, questions, and metadata." />;
  }

  return (
    <article className="rounded-md border border-claro-border bg-white p-5 shadow-panel">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-claro-mint">Doctor Summary Preview</p>
          <h2 className="mt-2 text-2xl font-semibold text-claro-ink">{summary.title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Generated {formatDateTime(summary.generated_at)} using {summary.model_name} and {summary.prompt_version}.
          </p>
        </div>
        <StatusBadge tone="attention">Not a diagnosis</StatusBadge>
      </div>
      <div className="mt-5 grid gap-3 lg:hidden">
        {sections.map((section) => (
          <a className="rounded-md border border-claro-border px-3 py-2 text-sm font-semibold text-claro-blue" href={`#${slugify(section.title)}`} key={section.title}>
            {section.title}
          </a>
        ))}
      </div>
      <div className="mt-6 space-y-4">
        {sections.map((section) => (
          <DoctorSummarySection key={section.title} title={section.title} value={section.value} />
        ))}
      </div>
      <SafetyNotice title="Clinical review required" tone="info">
        This summary is preparation material only. A qualified clinician should verify every item before making care decisions.
      </SafetyNotice>
    </article>
  );
}

function DoctorSummarySection({ title, value }: { title: string; value: unknown }) {
  return (
    <section className="rounded-md border border-claro-border p-4" id={slugify(title)}>
      <h3 className="font-semibold text-claro-ink">{title}</h3>
      <div className="mt-3 text-sm leading-6 text-slate-700">
        <StructuredValue value={value} />
      </div>
    </section>
  );
}

function EmergencyWorkspace({
  activeShare,
  shareHours,
  shares,
  status,
  onCreateShare,
  onPrint,
  onRevokeShare,
  onShareHoursChange
}: {
  activeShare: EmergencyShare | null;
  shareHours: number;
  shares: EmergencyShare[];
  status: string;
  onCreateShare: () => void;
  onPrint: () => void;
  onRevokeShare: (share: EmergencyShare) => void;
  onShareHoursChange: (value: number) => void;
}) {
  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-6 pb-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8">
      <section className="space-y-6">
        <EmergencyProfileReview profile={activeShare?.profile_payload ?? null} />
        <section className="rounded-md border border-amber-200 bg-amber-50 p-5 text-amber-950">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            <div>
              <h2 className="font-semibold">Emergency shares are public links</h2>
              <p className="mt-2 text-sm leading-6">
                Anyone who receives the link or QR code can view the emergency profile until the exact expiry time or revocation.
              </p>
            </div>
          </div>
        </section>
        <section className="rounded-md border border-claro-border bg-white p-5 shadow-panel">
          <SectionHeader icon={ShieldCheck} title="Senior Mode Emergency Access" description="A simplified one-click flow creates a short-lived share and keeps revoke controls visible." />
          <button className="mt-5 inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-md bg-claro-critical px-5 text-base font-semibold text-white disabled:opacity-70 sm:w-auto" type="button" onClick={onCreateShare} disabled={status === "saving"}>
            {status === "saving" ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <QrCode className="h-5 w-5" aria-hidden />}
            Create emergency QR now
          </button>
        </section>
      </section>
      <aside className="space-y-6">
        <EmergencySharePanel
          activeShare={activeShare}
          shareHours={shareHours}
          shares={shares}
          status={status}
          onCreateShare={onCreateShare}
          onPrint={onPrint}
          onRevokeShare={onRevokeShare}
          onShareHoursChange={onShareHoursChange}
        />
      </aside>
    </div>
  );
}

function EmergencyProfileReview({ profile }: { profile: Record<string, unknown> | null }) {
  const reviewItems = [
    { label: "Blood group", value: profile?.blood_group || "Not recorded" },
    { label: "Active medicines", value: profile?.current_medicines },
    { label: "Allergies", value: profile?.allergies },
    { label: "Known conditions", value: profile?.known_diseases },
    { label: "Emergency contacts", value: profile?.emergency_contacts },
    { label: "Safety notes", value: profile?.safety_notes }
  ];

  return (
    <section className="rounded-md border border-claro-border bg-white p-5 shadow-panel">
      <SectionHeader icon={FileHeart} title="Review Emergency Profile" description="Confirm the essentials before creating a public time-limited share." />
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {reviewItems.map((item) => (
          <article className="rounded-md border border-claro-border p-4" key={item.label}>
            <h3 className="font-semibold text-claro-ink">{item.label}</h3>
            <div className="mt-2 text-sm leading-6 text-slate-700">
              <StructuredValue value={item.value} compact />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function EmergencySharePanel({
  activeShare,
  shareHours,
  shares,
  status,
  onCreateShare,
  onPrint,
  onRevokeShare,
  onShareHoursChange
}: {
  activeShare: EmergencyShare | null;
  shareHours: number;
  shares: EmergencyShare[];
  status: string;
  onCreateShare: () => void;
  onPrint: () => void;
  onRevokeShare: (share: EmergencyShare) => void;
  onShareHoursChange: (value: number) => void;
}) {
  return (
    <section className="rounded-md border border-claro-border bg-white p-5 shadow-panel">
      <SectionHeader icon={QrCode} title="Share Link And QR" description="Create, print, inspect expiry, and revoke emergency access." />
      <div className="mt-5 space-y-5">
        <FormField label={`Share duration: ${shareHours} hours`}>
          <input className="w-full accent-claro-blue" min={1} max={168} type="range" value={shareHours} onChange={(event) => onShareHoursChange(Number(event.target.value))} />
        </FormField>
        <button className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-claro-blue px-4 text-sm font-semibold text-white disabled:opacity-70" type="button" onClick={onCreateShare} disabled={status === "saving"}>
          {status === "saving" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <QrCode className="h-4 w-4" aria-hidden />}
          Create share
        </button>
        {activeShare ? (
          <div className="rounded-md border border-claro-border p-4">
            <QrDisplay value={publicEmergencyUrl(activeShare.token)} />
            <div className="mt-4 space-y-2 text-sm leading-6 text-slate-700">
              <p className="break-all font-medium text-claro-ink">{publicEmergencyUrl(activeShare.token)}</p>
              <p>Expires {formatDateTime(activeShare.expires_at)} ({relativeTime(activeShare.expires_at)}).</p>
              <p>Last accessed: {activeShare.last_accessed_at ? formatDateTime(activeShare.last_accessed_at) : "Not accessed yet"}.</p>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700" type="button" onClick={onPrint}>
                <Printer className="h-4 w-4" aria-hidden />
                Print profile
              </button>
              <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-claro-rose px-4 text-sm font-semibold text-white disabled:opacity-50" type="button" disabled={!activeShare.is_active || activeShare.is_expired} onClick={() => onRevokeShare(activeShare)}>
                <Trash2 className="h-4 w-4" aria-hidden />
                Revoke
              </button>
            </div>
          </div>
        ) : (
          <EmptyState title="No emergency share" message="Create a share to display a QR-style access panel, link, expiry, and revoke control." />
        )}
        <div className="space-y-2">
          <h3 className="font-semibold text-claro-ink">Recent shares</h3>
          {shares.slice(0, 4).map((share) => (
            <article className="rounded-md border border-claro-border p-3" key={share.token}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-claro-ink">{share.label}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatDateTime(share.created_at)}</p>
                </div>
                <StatusBadge tone={share.is_active && !share.is_expired ? "success" : "neutral"}>
                  {share.is_active && !share.is_expired ? "active" : share.is_expired ? "expired" : "revoked"}
                </StatusBadge>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function QrDisplay({ value }: { value: string }) {
  const cells = Array.from({ length: 49 }, (_, index) => {
    const charCode = value.charCodeAt(index % value.length);
    return (charCode + index) % 3 !== 0;
  });
  return (
    <div className="mx-auto grid h-56 w-56 grid-cols-7 gap-1 rounded-md border border-claro-border bg-white p-4" aria-label="Emergency QR code preview">
      {cells.map((filled, index) => (
        <span className={cn("rounded-sm", filled ? "bg-claro-ink" : "bg-white")} key={index} />
      ))}
    </div>
  );
}

function RevokeShareDialog({
  share,
  onCancel,
  onConfirm
}: {
  share: EmergencyShare | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <ConfirmDialog
      title="Revoke emergency share?"
      message={`The link for ${share?.label ?? "this emergency profile"} will stop working immediately, even before its expiry time.`}
      open={Boolean(share)}
      onCancel={onCancel}
      onConfirm={onConfirm}
      confirmLabel="Revoke share"
    />
  );
}

function StructuredValue({ compact = false, value }: { compact?: boolean; value: unknown }) {
  if (value === null || value === undefined || value === "") {
    return <p className="text-slate-500">Not recorded.</p>;
  }
  if (Array.isArray(value)) {
    if (!value.length) return <p className="text-slate-500">No items recorded.</p>;
    return (
      <ul className={cn("space-y-2", compact && "space-y-1")}>
        {value.map((item, index) => (
          <li className="rounded-md bg-claro-muted p-3" key={index}>
            <StructuredValue value={item} compact />
          </li>
        ))}
      </ul>
    );
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).filter(([, entryValue]) => entryValue !== null && entryValue !== undefined && entryValue !== "");
    if (!entries.length) return <p className="text-slate-500">No details recorded.</p>;
    return (
      <dl className="grid gap-2">
        {entries.map(([key, entryValue]) => (
          <div className="grid gap-1 sm:grid-cols-[170px_minmax(0,1fr)]" key={key}>
            <dt className="font-medium capitalize text-slate-500">{key.replaceAll("_", " ")}</dt>
            <dd className="min-w-0">
              {typeof entryValue === "object" ? <StructuredValue value={entryValue} compact /> : String(entryValue)}
            </dd>
          </div>
        ))}
      </dl>
    );
  }
  return <p>{String(value)}</p>;
}

function findGrant(member: Membership, key: PermissionKey) {
  return member.permission_grants.find((grant) => grant.permission === key);
}

function publicEmergencyUrl(token: string) {
  return `${API_URL}/family-care/emergency-shares/${token}/public/`;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function relativeTime(value: string) {
  const diff = new Date(value).getTime() - Date.now();
  const abs = Math.abs(diff);
  const hours = Math.round(abs / (1000 * 60 * 60));
  const days = Math.round(abs / (1000 * 60 * 60 * 24));
  const unitValue = hours < 36 ? hours : days;
  const unit = hours < 36 ? "hour" : "day";
  const suffix = unitValue === 1 ? unit : `${unit}s`;
  return diff >= 0 ? `in ${unitValue} ${suffix}` : `${unitValue} ${suffix} ago`;
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
