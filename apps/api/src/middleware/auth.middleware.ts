// ==========================================
// MenuQR — Auth Middleware
//
// Reads the access token from the httpOnly cookie, verifies it, and attaches
// the decoded payload to req.authUser. If the access token is expired but a
// valid refresh token is present, a new access token is silently issued and
// re-set as a cookie. Also exposes a role guard factory.
// ==========================================

import { Request, Response, NextFunction } from "express";
import { TokenExpiredError } from "jsonwebtoken";
import {
  verifyAccessToken,
  verifyRefreshToken,
  signAccessToken,
} from "../services/auth.service";
import { setAuthCookie, ACCESS_COOKIE } from "../utils/cookies";
import type { ApiResponse, JwtPayload, UserRole } from "../types/auth.types";

function unauthorized(res: Response): Response {
  const body: ApiResponse = { success: false, error: "Not authenticated" };
  return res.status(401).json(body);
}

/**
 * Verifies authentication via the access-token cookie. On an expired access
 * token, attempts a silent refresh using the refresh-token cookie.
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const accessToken = req.cookies?.[ACCESS_COOKIE] as string | undefined;
  const refreshToken = req.cookies?.["mq_refresh_token"] as string | undefined;

  // Happy path: valid access token.
  if (accessToken) {
    try {
      req.authUser = verifyAccessToken(accessToken);
      next();
      return;
    } catch (err) {
      if (!(err instanceof TokenExpiredError)) {
        unauthorized(res);
        return;
      }
      // fall through to refresh
    }
  }

  // Silent refresh path.
  if (refreshToken) {
    try {
      const decoded = verifyRefreshToken(refreshToken);
      const payload: JwtPayload = {
        userId: decoded.userId,
        username: decoded.username,
        role: decoded.role,
        restaurant_id: decoded.restaurant_id,
        restaurant_slug: decoded.restaurant_slug,
        master_access: decoded.master_access,
      };
      const newAccess = signAccessToken(payload);
      setAuthCookie(res, ACCESS_COOKIE, newAccess, 15 * 60 * 1000);
      req.authUser = payload;
      next();
      return;
    } catch {
      unauthorized(res);
      return;
    }
  }

  unauthorized(res);
}

/**
 * Restricts a route to a set of roles. Must run after requireAuth.
 */
export function requireRole(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.authUser) {
      unauthorized(res);
      return;
    }
    if (!allowedRoles.includes(req.authUser.role)) {
      const body: ApiResponse = {
        success: false,
        error: "You do not have permission to perform this action.",
      };
      res.status(403).json(body);
      return;
    }
    next();
  };
}

/**
 * Resolves the restaurant scope for a request. SUPER_ADMIN may target any
 * restaurant via the ?restaurant_id query param; every other role is locked to
 * the restaurant_id embedded in their JWT. Never trust a body-supplied id.
 */
export function resolveRestaurantScope(req: Request): string | null {
  const user = req.authUser;
  if (!user) return null;

  if (user.role === "SUPER_ADMIN") {
    const queryId = req.query.restaurant_id;
    if (typeof queryId === "string" && queryId.length > 0) {
      return queryId;
    }
    return null;
  }

  return user.restaurant_id;
}
