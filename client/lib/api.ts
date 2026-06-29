import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { mockReports, mockTrends, mockUser } from "@/lib/mock-data";
import { authOptions } from "@/lib/auth";
import { Report, TrendResponse, UserProfile } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly path?: string,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_URL) {
    throw new Error("Missing NEXT_PUBLIC_API_URL");
  }
  const session = await getServerSession(authOptions);
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });
  if (!response.ok) {
    throw new ApiRequestError(`Request failed: ${response.status} ${response.statusText}`, response.status, path);
  }
  return response.json() as Promise<T>;
}

export async function getUserProfile(): Promise<UserProfile> {
  if (!API_URL || DEMO_MODE) {
    return mockUser;
  }
  try {
    return await request<UserProfile>("/users/me");
  } catch (error) {
    if (error instanceof ApiRequestError && (error.status === 401 || error.status === 403)) {
      redirect("/login?error=session_expired");
    }
    throw error;
  }
}

export async function getReports(): Promise<Report[]> {
  if (!API_URL || DEMO_MODE) {
    return mockReports;
  }
  try {
    return await request<Report[]>("/reports");
  } catch (error) {
    if (error instanceof ApiRequestError && (error.status === 401 || error.status === 403)) {
      redirect("/login?error=session_expired");
    }
    throw error;
  }
}

export async function getReport(id: string): Promise<Report> {
  if (!API_URL || DEMO_MODE) {
    const report = mockReports.find((item) => item._id === id);
    if (!report) {
      throw new Error("Report not found");
    }
    return report;
  }
  try {
    return await request<Report>(`/reports/${id}`);
  } catch (error) {
    if (error instanceof ApiRequestError && (error.status === 401 || error.status === 403)) {
      redirect("/login?error=session_expired");
    }
    throw error;
  }
}

export async function getTrends(): Promise<TrendResponse> {
  if (!API_URL || DEMO_MODE) {
    return mockTrends;
  }
  try {
    return await request<TrendResponse>("/reports/trends");
  } catch (error) {
    if (error instanceof ApiRequestError && (error.status === 401 || error.status === 403)) {
      redirect("/login?error=session_expired");
    }
    throw error;
  }
}
