import { getServerSession } from "next-auth";

import { mockReports, mockTrends, mockUser } from "@/lib/mock-data";
import { authOptions } from "@/lib/auth";
import { Report, TrendResponse, UserProfile } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

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
    throw new Error("Request failed");
  }
  return response.json() as Promise<T>;
}

export async function getUserProfile(): Promise<UserProfile> {
  if (!API_URL) {
    return mockUser;
  }
  return request<UserProfile>("/users/me");
}

export async function getReports(): Promise<Report[]> {
  if (!API_URL) {
    return mockReports;
  }
  return request<Report[]>("/reports");
}

export async function getReport(id: string): Promise<Report> {
  if (!API_URL) {
    const report = mockReports.find((item) => item._id === id);
    if (!report) {
      throw new Error("Report not found");
    }
    return report;
  }
  return request<Report>(`/reports/${id}`);
}

export async function getTrends(): Promise<TrendResponse> {
  if (!API_URL) {
    return mockTrends;
  }
  return request<TrendResponse>("/reports/trends");
}
