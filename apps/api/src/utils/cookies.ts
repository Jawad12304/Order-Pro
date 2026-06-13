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
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
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
  const opts: CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  };
  res.clearCookie(ACCESS_COOKIE, opts);
  res.clearCookie(REFRESH_COOKIE, opts);
}
