import { AlertCircle, FileClock, Loader2, LockKeyhole, ShieldAlert } from "lucide-react";

type StateProps = {
  title: string;
  message: string;
  action?: React.ReactNode;
};

export type RequestState = "idle" | "loading" | "success" | "empty" | "error";

export function LoadingState({ title = "Loading health data" }: Partial<StateProps>) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-5 text-slate-600">
      <div className="flex items-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-claro-blue" aria-hidden />
        <p className="font-medium">{title}</p>
      </div>
    </div>
  );
}

export function EmptyState({ title, message, action }: StateProps) {
  return (
    <div className="rounded-md border border-dashed border-slate-300 bg-white p-6 text-center">
      <FileClock className="mx-auto h-8 w-8 text-slate-400" aria-hidden />
      <p className="mt-3 font-semibold text-claro-ink">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{message}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ title, message, action }: StateProps) {
  return (
    <div className="rounded-md border border-rose-200 bg-rose-50 p-4 text-claro-rose">
      <div className="flex gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
        <div>
          <p className="font-semibold">{title}</p>
          <p className="mt-1 text-sm leading-6">{message}</p>
          {action ? <div className="mt-3">{action}</div> : null}
        </div>
      </div>
    </div>
  );
}

export function UnauthorizedState({ action }: Pick<StateProps, "action">) {
  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-amber-900">
      <div className="flex gap-3">
        <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
        <div>
          <p className="font-semibold">Sign in required</p>
          <p className="mt-1 text-sm leading-6">
            This workspace uses your MedClaro session instead of page-level API tokens.
          </p>
          {action ? <div className="mt-3">{action}</div> : null}
        </div>
      </div>
    </div>
  );
}

export function PermissionState({ title, message, action }: StateProps) {
  return (
    <div className="rounded-md border border-amber-200 bg-white p-4 text-amber-900">
      <div className="flex gap-3">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
        <div>
          <p className="font-semibold">{title}</p>
          <p className="mt-1 text-sm leading-6">{message}</p>
          {action ? <div className="mt-3">{action}</div> : null}
        </div>
      </div>
    </div>
  );
}
