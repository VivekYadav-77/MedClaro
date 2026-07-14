"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  BrainCircuit,
  Download,
  FileCheck2,
  FileText,
  Filter,
  Pencil,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  X
} from "lucide-react";
import {
  Drawer,
  FormField,
  InlineValidation,
  PageHeader,
  PermissionNotice,
  SafetyNotice,
  SectionHeader,
  StatusBadge,
  SuccessLine
} from "@/components/design-system";
import { EmptyState, LoadingState, UnauthorizedState } from "@/components/app-states";
import { API_URL, apiJson, documentsApi } from "@/lib/api";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/ui";

type DocumentRow = {
  id: number;
  title: string;
  document_type: string;
  original_filename: string;
  content_type: string;
  size_bytes: number;
  status: string;
  description: string;
  source_date: string | null;
  analysis_handoff: {
    ready_for?: string;
    status?: string;
    notes?: string;
  };
  failure_reason: string;
  preview_url: string | null;
  created_at: string;
  updated_at: string;
};

const documentTypes = [
  { value: "lab_report", label: "Lab report", action: "Analyze report" },
  { value: "prescription", label: "Prescription", action: "Analyze prescription" },
  { value: "scan", label: "Scan or imaging", action: "Preview" },
  { value: "insurance", label: "Insurance", action: "Preview" },
  { value: "invoice", label: "Invoice", action: "Preview" },
  { value: "other", label: "Other", action: "Edit metadata" }
];

const inputClass =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 outline-none transition focus:border-claro-blue focus:ring-2 focus:ring-blue-100";

export default function DocumentsPage() {
  const router = useRouter();
  const { token, isReady, isSignedIn } = useSession();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [title, setTitle] = useState("");
  const [documentType, setDocumentType] = useState("lab_report");
  const [description, setDescription] = useState("");
  const [sourceDate, setSourceDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "uploading" | "saved" | "error">("loading");
  const [message, setMessage] = useState("");

  const selectedDocument = useMemo(
    () => documents.find((document) => document.id === selectedId) ?? null,
    [documents, selectedId]
  );

  const filteredDocuments = useMemo(() => {
    return documents.filter((document) => {
      const matchesType = typeFilter === "all" || document.document_type === typeFilter;
      const matchesStatus = statusFilter === "all" || document.status === statusFilter;
      const normalizedQuery = query.trim().toLowerCase();
      const matchesQuery =
        !normalizedQuery ||
        [document.title, document.original_filename, document.description]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      return matchesType && matchesStatus && matchesQuery;
    });
  }, [documents, query, statusFilter, typeFilter]);

  useEffect(() => {
    if (!isReady) return;
    if (!isSignedIn) {
      setStatus("idle");
      return;
    }
    loadDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, isSignedIn]);

  async function loadDocuments() {
    setStatus("loading");
    setMessage("");
    try {
      const data = await documentsApi.list<DocumentRow[]>(token);
      setDocuments(data);
      setSelectedId((current) => current ?? data[0]?.id ?? null);
      setStatus("idle");
    } catch {
      setStatus("error");
      setMessage("Could not load your vault. Check your session and try again.");
    }
  }

  async function uploadDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setStatus("error");
      setMessage("Choose a file before uploading.");
      return;
    }

    const form = new FormData();
    form.append("title", title.trim() || file.name);
    form.append("document_type", documentType);
    form.append("description", description);
    if (sourceDate) form.append("source_date", sourceDate);
    form.append("file", file);

    setStatus("uploading");
    setMessage("Uploading document to your private vault...");

    try {
      const uploaded = await documentsApi.upload<DocumentRow>(form, token);
      setTitle("");
      setDescription("");
      setSourceDate("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setDocuments((current) => [uploaded, ...current.filter((item) => item.id !== uploaded.id)]);
      setSelectedId(uploaded.id);
      setStatus("saved");
      setMessage("Document uploaded. Processing is queued for the next matching analysis workflow.");
    } catch {
      setStatus("error");
      setMessage("Upload failed. Check file type, size, and required fields.");
    }
  }

  async function deleteDocument(document: DocumentRow) {
    const confirmed = window.confirm(`Delete ${document.title} from your vault?`);
    if (!confirmed) return;
    try {
      await apiJson<null>(`/documents/${document.id}/`, { method: "DELETE", token });
      setDocuments((current) => current.filter((item) => item.id !== document.id));
      setSelectedId(null);
      setStatus("saved");
      setMessage("Document removed from your vault.");
    } catch {
      setStatus("error");
      setMessage("Could not delete this document.");
    }
  }

  async function downloadDocument(document: DocumentRow) {
    try {
      const response = await fetch(`${API_URL}/documents/${document.id}/download/`, {
        headers: token ? { Authorization: `Token ${token}` } : undefined
      });
      if (!response.ok) throw new Error("download failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement("a");
      link.href = url;
      link.download = document.original_filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setStatus("error");
      setMessage("Download failed. Try again after refreshing your session.");
    }
  }

  if (!isReady || status === "loading") {
    return (
      <main className="min-h-screen bg-claro-background p-6">
        <LoadingState title="Loading Medical Vault" />
      </main>
    );
  }

  if (!isSignedIn) {
    return (
      <main className="min-h-screen bg-claro-background p-6">
        <UnauthorizedState
          action={
            <button
              className="min-h-11 rounded-md bg-claro-blue px-4 text-sm font-semibold text-white"
              type="button"
              onClick={() => router.push("/signin")}
            >
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
        eyebrow="Medical Vault"
        title="Secure Personal Health Archive"
        description="Upload reports, prescriptions, scans, and health paperwork with metadata that makes future review and AI analysis easier."
        actions={
          <button
            className="inline-flex min-h-11 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700"
            type="button"
            onClick={loadDocuments}
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
            Refresh
          </button>
        }
        notice={
          <PermissionNotice title="Owner-scoped vault">
            Documents use your signed-in session. Downloads and previews are protected
            by token-aware requests, and shared access is handled separately.
          </PermissionNotice>
        }
      />

      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[370px_minmax(0,1fr)] lg:px-8">
        <aside className="space-y-6">
          <form className="rounded-md border border-claro-border bg-white p-5 shadow-panel" onSubmit={uploadDocument}>
            <SectionHeader
              icon={Upload}
              title="Upload Document"
              description="Confirm type, date, and source notes before adding the file to your vault."
            />

            <button
              className={cn(
                "mt-5 flex min-h-36 w-full flex-col items-center justify-center rounded-md border border-dashed px-4 text-center transition",
                file ? "border-claro-mint bg-emerald-50" : "border-slate-300 bg-claro-muted hover:bg-slate-100"
              )}
              type="button"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileCheck2 className="h-8 w-8 text-claro-blue" aria-hidden />
              <span className="mt-3 text-sm font-semibold text-claro-ink">
                {file ? file.name : "Choose PDF, image, DOC, or DOCX"}
              </span>
              <span className="mt-1 text-sm text-slate-600">
                Keyboard and file input fallback supported.
              </span>
            </button>
            <input
              ref={fileInputRef}
              className="sr-only"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />

            <div className="mt-5 space-y-4">
              <FormField label="Title" hint="Leave blank to use the file name.">
                <input className={inputClass} value={title} onChange={(event) => setTitle(event.target.value)} />
              </FormField>
              <DocumentTypeSelector value={documentType} onChange={setDocumentType} />
              <FormField label="Source date">
                <input className={inputClass} type="date" value={sourceDate} onChange={(event) => setSourceDate(event.target.value)} />
              </FormField>
              <FormField label="Description">
                <textarea className={inputClass} rows={3} value={description} onChange={(event) => setDescription(event.target.value)} />
              </FormField>
              <button
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-claro-blue px-4 text-sm font-semibold text-white disabled:opacity-70"
                type="submit"
                disabled={status === "uploading"}
              >
                <Upload className="h-4 w-4" aria-hidden />
                {status === "uploading" ? "Uploading..." : "Upload to vault"}
              </button>
              {status === "uploading" ? <ProgressBar /> : null}
              {status === "error" ? <InlineValidation>{message}</InlineValidation> : null}
              {status === "saved" ? <SuccessLine>{message}</SuccessLine> : null}
            </div>
          </form>

          <SafetyNotice title="Analysis boundary">
            Uploaded files are stored first. Report and prescription analysis remain
            separate user actions so you can verify metadata before running AI.
          </SafetyNotice>
        </aside>

        <section className="space-y-5">
          <VaultFilterBar
            query={query}
            statusFilter={statusFilter}
            typeFilter={typeFilter}
            onQueryChange={setQuery}
            onStatusChange={setStatusFilter}
            onTypeChange={setTypeFilter}
          />

          <section className="rounded-md border border-claro-border bg-white p-5 shadow-panel">
            <SectionHeader
              icon={Archive}
              title="Document History"
              description={`${filteredDocuments.length} of ${documents.length} records shown`}
            />

            <div className="mt-5 overflow-hidden rounded-md border border-claro-border">
              {filteredDocuments.length === 0 ? (
                <div className="p-6">
                  <EmptyState
                    title="No matching documents"
                    message="Upload a document or adjust filters to see vault records."
                  />
                </div>
              ) : (
                <div className="divide-y divide-claro-border">
                  {filteredDocuments.map((document) => (
                    <DocumentListRow
                      document={document}
                      key={document.id}
                      onAnalyze={() =>
                        document.document_type === "lab_report"
                          ? router.push(`/reports?document=${document.id}`)
                          : router.push("/prescriptions")
                      }
                      onDownload={() => downloadDocument(document)}
                      onOpen={() => setSelectedId(document.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        </section>
      </div>

      <DocumentDetailDrawer
        document={selectedDocument}
        open={Boolean(selectedDocument)}
        onClose={() => setSelectedId(null)}
        onAnalyze={() => {
          if (!selectedDocument) return;
          selectedDocument.document_type === "lab_report"
            ? router.push(`/reports?document=${selectedDocument.id}`)
            : router.push("/prescriptions");
        }}
        onDelete={() => selectedDocument && deleteDocument(selectedDocument)}
        onDownload={() => selectedDocument && downloadDocument(selectedDocument)}
      />
    </main>
  );
}

function DocumentTypeSelector({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <FormField label="Document type">
      <div className="grid grid-cols-2 gap-2">
        {documentTypes.map((type) => (
          <button
            className={cn(
              "min-h-11 rounded-md border px-3 text-left text-sm font-semibold transition",
              value === type.value
                ? "border-claro-blue bg-blue-50 text-claro-blue"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            )}
            key={type.value}
            type="button"
            onClick={() => onChange(type.value)}
          >
            {type.label}
          </button>
        ))}
      </div>
    </FormField>
  );
}

function VaultFilterBar({
  query,
  statusFilter,
  typeFilter,
  onQueryChange,
  onStatusChange,
  onTypeChange
}: {
  query: string;
  statusFilter: string;
  typeFilter: string;
  onQueryChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onTypeChange: (value: string) => void;
}) {
  return (
    <div className="rounded-md border border-claro-border bg-white p-4 shadow-panel">
      <div className="flex items-center gap-2">
        <Filter className="h-5 w-5 text-claro-blue" aria-hidden />
        <h2 className="font-semibold text-claro-ink">Quick Filters</h2>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_180px]">
        <label className="relative block">
          <span className="sr-only">Search documents</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            className={`${inputClass} pl-9`}
            placeholder="Search title, file, or notes"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </label>
        <select className={inputClass} value={typeFilter} onChange={(event) => onTypeChange(event.target.value)} aria-label="Document type filter">
          <option value="all">All types</option>
          {documentTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        <select className={inputClass} value={statusFilter} onChange={(event) => onStatusChange(event.target.value)} aria-label="Document status filter">
          <option value="all">All statuses</option>
          {["uploaded", "queued", "processing", "analyzed", "needs_review", "failed"].map((status) => (
            <option key={status} value={status}>
              {labelize(status)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function DocumentListRow({
  document,
  onAnalyze,
  onDownload,
  onOpen
}: {
  document: DocumentRow;
  onAnalyze: () => void;
  onDownload: () => void;
  onOpen: () => void;
}) {
  const type = documentTypes.find((item) => item.value === document.document_type);
  const canAnalyze = document.document_type === "lab_report" || document.document_type === "prescription";

  return (
    <article className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1.1fr)_160px_130px_150px] lg:items-center">
      <button className="min-w-0 text-left" type="button" onClick={onOpen}>
        <span className="flex items-center gap-2">
          <FileText className="h-5 w-5 shrink-0 text-claro-blue" aria-hidden />
          <span className="truncate font-semibold text-claro-ink">{document.title}</span>
        </span>
        <span className="mt-1 block truncate text-sm text-slate-600">{document.original_filename}</span>
      </button>
      <div className="text-sm text-slate-600">
        <p className="font-medium text-claro-ink">{type?.label ?? labelize(document.document_type)}</p>
        <p>{formatBytes(document.size_bytes)}</p>
      </div>
      <DocumentStatusBadge status={document.status} />
      <div className="flex flex-wrap gap-2">
        <button
          className="inline-flex min-h-10 items-center gap-2 rounded-md bg-claro-blue px-3 text-sm font-semibold text-white"
          type="button"
          onClick={canAnalyze ? onAnalyze : onOpen}
        >
          {canAnalyze ? <BrainCircuit className="h-4 w-4" aria-hidden /> : <Pencil className="h-4 w-4" aria-hidden />}
          {canAnalyze ? type?.action : "Details"}
        </button>
        <button className="grid h-10 w-10 place-items-center rounded-md border border-slate-300 text-slate-700" type="button" onClick={onDownload} aria-label={`Download ${document.title}`}>
          <Download className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </article>
  );
}

function DocumentDetailDrawer({
  document,
  open,
  onAnalyze,
  onClose,
  onDelete,
  onDownload
}: {
  document: DocumentRow | null;
  open: boolean;
  onAnalyze: () => void;
  onClose: () => void;
  onDelete: () => void;
  onDownload: () => void;
}) {
  if (!document) return null;
  const canAnalyze = document.document_type === "lab_report" || document.document_type === "prescription";

  return (
    <Drawer title="Document Details" open={open} onClose={onClose}>
      <div className="space-y-5">
        <div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-claro-ink">{document.title}</h2>
              <p className="mt-1 text-sm text-slate-600">{document.original_filename}</p>
            </div>
            <DocumentStatusBadge status={document.status} />
          </div>
          {document.description ? <p className="mt-4 text-sm leading-6 text-slate-700">{document.description}</p> : null}
        </div>

        <dl className="grid gap-3 rounded-md border border-claro-border bg-claro-muted p-4 text-sm">
          <DetailItem label="Type" value={labelize(document.document_type)} />
          <DetailItem label="Source date" value={document.source_date ? formatDate(document.source_date) : "Not added"} />
          <DetailItem label="Size" value={formatBytes(document.size_bytes)} />
          <DetailItem label="Uploaded" value={formatDate(document.created_at)} />
          <DetailItem label="Updated" value={formatDate(document.updated_at)} />
          <DetailItem label="Processing" value={document.analysis_handoff?.notes || "Awaiting review."} />
        </dl>

        {document.failure_reason ? (
          <SafetyNotice title="Processing issue" tone="attention">
            {document.failure_reason}
          </SafetyNotice>
        ) : null}

        <div className="grid gap-3">
          <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-claro-blue px-4 text-sm font-semibold text-white" type="button" onClick={canAnalyze ? onAnalyze : onClose}>
            {canAnalyze ? <BrainCircuit className="h-4 w-4" aria-hidden /> : <X className="h-4 w-4" aria-hidden />}
            {canAnalyze ? "Send to analysis" : "Close preview"}
          </button>
          <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700" type="button" onClick={onDownload}>
            <Download className="h-4 w-4" aria-hidden />
            Download file
          </button>
          <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-rose-200 px-4 text-sm font-semibold text-claro-rose" type="button" onClick={onDelete}>
            <Trash2 className="h-4 w-4" aria-hidden />
            Delete from vault
          </button>
        </div>
      </div>
    </Drawer>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-medium text-slate-500">{label}</dt>
      <dd className="mt-1 text-slate-800">{value}</dd>
    </div>
  );
}

function DocumentStatusBadge({ status }: { status: string }) {
  const tone =
    status === "analyzed"
      ? "success"
      : status === "failed"
        ? "risk"
        : status === "needs_review"
          ? "attention"
          : status === "processing" || status === "queued"
            ? "info"
            : "neutral";

  return <StatusBadge tone={tone}>{labelize(status)}</StatusBadge>;
}

function ProgressBar() {
  return (
    <div aria-label="Upload progress" className="h-2 overflow-hidden rounded-full bg-slate-200" role="progressbar">
      <div className="h-full w-2/3 animate-pulse rounded-full bg-claro-blue" />
    </div>
  );
}

function labelize(value?: string | null) {
  if (!value) return "";
  return String(value).replaceAll("_", " ");
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}
