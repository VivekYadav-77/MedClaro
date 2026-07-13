"use client";

import { FormEvent, useState } from "react";
import {
  AlertCircle,
  Archive,
  FileClock,
  FileText,
  ShieldCheck,
  Upload
} from "lucide-react";
import { documentsApi } from "@/lib/api";
import { useSession } from "@/lib/session";

type DocumentRow = {
  id: number;
  title: string;
  document_type: string;
  original_filename: string;
  size_bytes: number;
  status: string;
  preview_url: string | null;
  created_at: string;
};

const inputClass =
  "mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-claro-blue focus:ring-2 focus:ring-blue-100";

export default function DocumentsPage() {
  const { token } = useSession();
  const [title, setTitle] = useState("");
  const [documentType, setDocumentType] = useState("lab_report");
  const [description, setDescription] = useState("");
  const [sourceDate, setSourceDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [status, setStatus] = useState<"idle" | "saved" | "loaded" | "error">(
    "idle"
  );

  async function loadDocuments() {
    try {
      setDocuments(await documentsApi.list<DocumentRow[]>(token));
      setStatus("loaded");
    } catch {
      setStatus("error");
    }
  }

  async function uploadDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setStatus("error");
      return;
    }

    const form = new FormData();
    form.append("title", title);
    form.append("document_type", documentType);
    form.append("description", description);
    if (sourceDate) {
      form.append("source_date", sourceDate);
    }
    form.append("file", file);

    try {
      await documentsApi.upload<DocumentRow>(form, token);
      setTitle("");
      setDescription("");
      setSourceDate("");
      setFile(null);
      setStatus("saved");
      await loadDocuments();
    } catch {
      setStatus("error");
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-claro-mint">
                Medical Vault
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-claro-ink">
                Upload And Organize Health Documents
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                Store reports, prescriptions, scans, invoices, and insurance
                files as private user-owned records ready for future AI analysis.
              </p>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <ShieldCheck className="h-4 w-4 text-claro-mint" />
                Owner-scoped access
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Documents use your signed-in session and are never listed for other users.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[0.9fr_1.1fr]">
        <form
          className="rounded-md border border-slate-200 bg-white p-5"
          onSubmit={uploadDocument}
        >
          <div className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-claro-blue" />
            <h2 className="text-lg font-semibold text-claro-ink">
              Upload Document
            </h2>
          </div>
          <div className="mt-5 space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Title
              <input
                className={inputClass}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Document type
              <select
                className={inputClass}
                value={documentType}
                onChange={(event) => setDocumentType(event.target.value)}
              >
                <option value="lab_report">Lab report</option>
                <option value="prescription">Prescription</option>
                <option value="scan">Scan or imaging</option>
                <option value="insurance">Insurance</option>
                <option value="invoice">Invoice</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Source date
              <input
                className={inputClass}
                type="date"
                value={sourceDate}
                onChange={(event) => setSourceDate(event.target.value)}
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Description
              <textarea
                className={inputClass}
                rows={3}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              File
              <input
                className={inputClass}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
            </label>
            <p className="text-sm leading-6 text-slate-500">
              Supported files: PDF, PNG, JPG, WEBP, DOC, DOCX. Current backend
              max upload size is configured through `DJANGO_MAX_UPLOAD_MB`.
            </p>
            <div className="flex gap-3">
              <button
                className="inline-flex items-center justify-center rounded-md bg-claro-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                type="submit"
              >
                Upload
              </button>
              <button
                className="inline-flex items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                type="button"
                onClick={loadDocuments}
              >
                Load History
              </button>
            </div>
            {status === "error" ? (
              <p className="flex items-center gap-2 text-sm font-medium text-claro-rose">
                <AlertCircle className="h-4 w-4" />
                Request failed. Check your session, required fields, and file type.
              </p>
            ) : null}
            {status === "saved" || status === "loaded" ? (
              <p className="text-sm font-medium text-claro-mint">
                Vault request completed.
              </p>
            ) : null}
          </div>
        </form>

        <section className="rounded-md border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Archive className="h-5 w-5 text-claro-mint" />
              <h2 className="text-lg font-semibold text-claro-ink">
                Document History
              </h2>
            </div>
            <span className="text-sm font-medium text-slate-500">
              {documents.length} records
            </span>
          </div>

          <div className="mt-5 space-y-3">
            {documents.length === 0 ? (
              <div className="rounded-md border border-dashed border-slate-300 p-6 text-center">
                <FileClock className="mx-auto h-8 w-8 text-slate-400" />
                <p className="mt-3 text-sm font-medium text-slate-700">
                  No documents loaded yet
                </p>
              </div>
            ) : (
              documents.map((document) => (
                <article
                  className="rounded-md border border-slate-200 p-4"
                  key={document.id}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-claro-blue" />
                        <h3 className="font-semibold text-claro-ink">
                          {document.title}
                        </h3>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">
                        {document.original_filename}
                      </p>
                    </div>
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold uppercase text-slate-600">
                      {document.status}
                    </span>
                  </div>
                  <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                    <div>
                      <dt className="font-medium text-slate-500">Type</dt>
                      <dd className="mt-1 text-slate-800">
                        {document.document_type}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-slate-500">Size</dt>
                      <dd className="mt-1 text-slate-800">
                        {Math.round(document.size_bytes / 1024)} KB
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-slate-500">Uploaded</dt>
                      <dd className="mt-1 text-slate-800">
                        {new Date(document.created_at).toLocaleDateString()}
                      </dd>
                    </div>
                  </dl>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
