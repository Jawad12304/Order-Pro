// ==========================================
// MenuQR — API Client
//
// Axios instance configured to:
//   1. Target the Express backend
//   2. Send httpOnly cookies automatically (withCredentials)
//   3. Provide consistent error unwrapping
//   4. Return typed { success, data, error } envelopes
// ==========================================

import axios, { AxiosError } from "axios";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // sends mq_access_token + mq_refresh_token cookies
  headers: {
    "Content-Type": "application/json",
  },
});

// ==========================================
// Standard API envelope
// ==========================================

export interface ApiEnvelope<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// ==========================================
// Auth-specific payload types
// ==========================================

export type UserRole =
  | "SUPER_ADMIN"
  | "RESTAURANT_ADMIN"
  | "MANAGER"
  | "KITCHEN"
  | "WAITER";

export interface LoginResult {
  role: UserRole;
  redirect_url: string;
  restaurant_name: string | null;
  username: string;
}

export interface MeResult {
  userId: string;
  username: string;
  role: UserRole;
  restaurant_id: string | null;
  restaurant_slug: string | null;
  master_access: boolean;
}

// ==========================================
// Auth API helpers
// ==========================================

export async function apiLogin(
  username: string,
  password: string
): Promise<LoginResult> {
  const res = await api.post<ApiEnvelope<LoginResult>>("/auth/login", {
    username,
    password,
  });
  const envelope = res.data;
  if (!envelope.success || !envelope.data) {
    throw new Error(envelope.error ?? "Login failed");
  }
  return envelope.data;
}

export async function apiLogout(): Promise<void> {
  await api.post("/auth/logout");
}

export async function apiGetMe(): Promise<MeResult | null> {
  try {
    const res = await api.get<ApiEnvelope<MeResult>>("/auth/me");
    return res.data.data ?? null;
  } catch {
    return null;
  }
}

// ==========================================
// Generic error unwrapper for consumers
// ==========================================

export function getApiErrorMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    // Network error (server unreachable, CORS blocked, etc.)
    if (!err.response) {
      return "Unable to reach the server. Make sure the API is running.";
    }
    const envelope = err.response?.data as ApiEnvelope | undefined;
    if (envelope?.error) return envelope.error;
    if (err.response?.status === 429) {
      return "Too many login attempts. Try again in 15 minutes.";
    }
    if (err.response?.status === 403) {
      return "Your account has been disabled. Contact your restaurant administrator.";
    }
  }
  if (err instanceof Error) return err.message;
  return "Something went wrong. Please try again.";
}
