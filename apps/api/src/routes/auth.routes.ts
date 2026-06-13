// ==========================================
// MenuQR — Auth Routes
//
// POST /api/auth/login   — username/password login (rate limited)
// POST /api/auth/logout  — clears auth cookies
// GET  /api/auth/me      — returns the current authenticated user
// ==========================================

import { Router, Request, Response } from "express";
import { ZodError } from "zod";
import { login, AuthError } from "../services/auth.service";
import { LoginSchema } from "../types/auth.types";
import type { ApiResponse, LoginResult } from "../types/auth.types";
import { loginRateLimiter } from "../middleware/rate-limit.middleware";
import { requireAuth } from "../middleware/auth.middleware";
import {
  setAuthCookie,
  clearAuthCookies,
  ACCESS_COOKIE,
  REFRESH_COOKIE,
} from "../utils/cookies";

const router = Router();

const ACCESS_MAX_AGE = 15 * 60 * 1000; // 15 minutes
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

function clientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0]!.trim();
  }
  return req.ip ?? req.socket.remoteAddress ?? "unknown";
}

// ------------------------------------------
// POST /api/auth/login
// ------------------------------------------
router.post("/login", loginRateLimiter, async (req: Request, res: Response) => {
  try {
    const { username, password } = LoginSchema.parse(req.body);

    const ctx = {
      ipAddress: clientIp(req),
      userAgent: req.headers["user-agent"] ?? "unknown",
    };

    const { result, accessToken, refreshToken } = await login(
      username,
      password,
      ctx
    );

    setAuthCookie(res, ACCESS_COOKIE, accessToken, ACCESS_MAX_AGE);
    setAuthCookie(res, REFRESH_COOKIE, refreshToken, REFRESH_MAX_AGE);

    const body: ApiResponse<LoginResult> = { success: true, data: result };
    res.status(200).json(body);
  } catch (err) {
    if (err instanceof ZodError) {
      const body: ApiResponse = {
        success: false,
        error: err.errors[0]?.message ?? "Invalid input",
      };
      res.status(400).json(body);
      return;
    }
    if (err instanceof AuthError) {
      const body: ApiResponse = { success: false, error: err.clientMessage };
      res.status(err.status).json(body);
      return;
    }
    console.error("[auth] login error:", err);
    const body: ApiResponse = {
      success: false,
      error: "Something went wrong. Please try again.",
    };
    res.status(500).json(body);
  }
});

// ------------------------------------------
// POST /api/auth/logout
// ------------------------------------------
router.post("/logout", (_req: Request, res: Response) => {
  clearAuthCookies(res);
  const body: ApiResponse = { success: true };
  res.status(200).json(body);
});

// ------------------------------------------
// GET /api/auth/me
// ------------------------------------------
router.get("/me", requireAuth, (req: Request, res: Response) => {
  const user = req.authUser!;
  const body: ApiResponse = {
    success: true,
    data: {
      userId: user.userId,
      username: user.username,
      role: user.role,
      restaurant_id: user.restaurant_id,
      restaurant_slug: user.restaurant_slug,
      master_access: user.master_access,
    },
  };
  res.status(200).json(body);
});

export default router;
