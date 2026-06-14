// ==========================================
// MenuQR — Cookie Helpers
//
// Centralizes httpOnly cookie config so the access/refresh cookies are set and
// cleared consistently across login, refresh and logout.
// ==========================================

import { Response, CookieOptions } from "express";

export const ACCESS_COOKIE = "mq_access_token";
export const REFRESH_COOKIE = "mq_refresh_token";

function baseOptions(maxAgeMs: number): CookieOptions {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    path: "/",
    maxAge: maxAgeMs,
  };
}

export function setAuthCookie(
  res: Response,
  name: string,
  value: string,
  maxAgeMs: number
): void {
  res.cookie(name, value, baseOptions(maxAgeMs));
}

export function clearAuthCookies(res: Response): void {
  const isProduction = process.env.NODE_ENV === "production";
  const opts: CookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    path: "/",
  };
  res.clearCookie(ACCESS_COOKIE, opts);
  res.clearCookie(REFRESH_COOKIE, opts);
}
