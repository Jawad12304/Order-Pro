"use client";

// ==========================================
// MenuQR — useAuth Hook
//
// Provides the current user state by calling GET /api/auth/me (which reads
// the httpOnly access/refresh token cookies on the backend). Exposes:
//   - currentUser: MeResult | null
//   - loading: boolean
//   - logout(): Promise<void>
//   - refresh(): Promise<void>  — re-fetches /me (e.g. after login)
// ==========================================

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { apiGetMe, apiLogout, type MeResult } from "@/lib/api";

export type { MeResult };

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<MeResult | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const user = await apiGetMe();
      setCurrentUser(user);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // best-effort: even if logout call fails, redirect to login
    }
    setCurrentUser(null);
    router.push("/");
  }, [router]);

  return { currentUser, loading, logout, refresh };
}
