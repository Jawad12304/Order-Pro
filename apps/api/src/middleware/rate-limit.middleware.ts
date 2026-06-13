// ==========================================
// MenuQR — Rate Limit Middleware
//
// Throttles login attempts to mitigate brute-force/credential-stuffing. Limits
// to 5 attempts per IP per 15 minutes. Only failed attempts count toward the
// limit (successful logins are skipped) so legitimate users are not penalized.
// ==========================================

import rateLimit from "express-rate-limit";
import type { ApiResponse } from "../types/auth.types";

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

const tooManyAttempts: ApiResponse = {
  success: false,
  error: "Too many login attempts. Try again in 15 minutes.",
};

export const loginRateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: MAX_ATTEMPTS,
  standardHeaders: true,
  legacyHeaders: false,
  // Count only failed attempts (4xx/5xx). Successful logins (2xx) are skipped.
  skipSuccessfulRequests: true,
  message: tooManyAttempts,
  handler: (_req, res) => {
    res.status(429).json(tooManyAttempts);
  },
});
