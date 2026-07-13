export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export type ApiErrorKind =
  | "validation"
  | "unauthorized"
  | "permission"
  | "not_found"
  | "network"
  | "server";

export class ApiError extends Error {
  status: number;
  kind: ApiErrorKind;
  details: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
    this.kind = normalizeErrorKind(status);
  }
}

type ApiRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  token?: string | null;
  body?: unknown;
  headers?: HeadersInit;
};

type ApiFormOptions = Omit<ApiRequestOptions, "body" | "headers"> & {
  body: FormData;
  headers?: HeadersInit;
};

function normalizeErrorKind(status: number): ApiErrorKind {
  if (status === 400 || status === 409 || status === 422) return "validation";
  if (status === 401) return "unauthorized";
  if (status === 403) return "permission";
  if (status === 404) return "not_found";
  if (status >= 500) return "server";
  return "network";
}

function authHeaders(token?: string | null): HeadersInit {
  return token ? { Authorization: `Token ${token}` } : {};
}

async function parseResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  if (response.status === 204) return null;
  if (contentType.includes("application/json")) return response.json();
  return response.text();
}

async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...authHeaders(options.token),
      ...options.headers
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const data = await parseResponse(response);

  if (!response.ok) {
    throw new ApiError(response.status, `API request failed with ${response.status}`, data);
  }

  return data as T;
}

export async function apiJson<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  return apiRequest<T>(path, options);
}

export async function apiGet<T>(path: string, token?: string | null): Promise<T> {
  return apiRequest<T>(path, { token });
}

export async function apiForm<T>(
  path: string,
  options: ApiFormOptions
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "POST",
    headers: {
      Accept: "application/json",
      ...authHeaders(options.token),
      ...options.headers
    },
    body: options.body
  });

  const data = await parseResponse(response);

  if (!response.ok) {
    throw new ApiError(response.status, `API request failed with ${response.status}`, data);
  }

  return data as T;
}

export const accountsApi = {
  register: <T>(body: unknown) => apiJson<T>("/accounts/register/", { method: "POST", body }),
  login: <T>(body: unknown) => apiJson<T>("/accounts/login/", { method: "POST", body }),
  me: <T>(token: string) => apiGet<T>("/accounts/me/", token),
  logout: <T>(token: string) =>
    apiJson<T>("/accounts/logout/", { method: "POST", token })
};

export const profilesApi = {
  create: <T>(body: unknown, token?: string | null) =>
    apiJson<T>("/profiles/", { method: "POST", token, body }),
  list: <T>(token?: string | null) => apiGet<T>("/profiles/", token)
};

export const documentsApi = {
  list: <T>(token?: string | null) => apiGet<T>("/documents/", token),
  upload: <T>(body: FormData, token?: string | null) =>
    apiForm<T>("/documents/", { method: "POST", token, body })
};
