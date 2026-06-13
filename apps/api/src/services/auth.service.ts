// ==========================================
// MenuQR — Auth Service
//
// Houses the core login logic: user lookup, master-password bypass, bcrypt
// verification, JWT issuance and the role -> redirect mapping.
// ==========================================

import jwt, { SignOptions } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { prisma } from "@order-pro/database";
import { isMasterPassword } from "../utils/master-password";
import type { JwtPayload, LoginResult, UserRole } from "../types/auth.types";

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL = "7d";

// A real-looking bcrypt hash used for a dummy compare when the user does not
// exist, so that failed lookups take roughly the same time as real ones and we
// do not leak username existence through timing.
const DUMMY_HASH =
  "$2a$12$CwTycUXWue0Thq9StjUM0uJ8DvRy2qVQGQ1z6.0bH2qKzN0Z7s0Ya";

export class AuthError extends Error {
  constructor(
    public readonly status: number,
    public readonly clientMessage: string
  ) {
    super(clientMessage);
    this.name = "AuthError";
  }
}

interface LoginContext {
  ipAddress: string;
  userAgent: string;
}

interface LoginServiceResult {
  result: LoginResult;
  accessToken: string;
  refreshToken: string;
}

function getAccessSecret(): string {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error("JWT_ACCESS_SECRET is not configured");
  return secret;
}

function getRefreshSecret(): string {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error("JWT_REFRESH_SECRET is not configured");
  return secret;
}

export function computeRedirectUrl(role: UserRole): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "/superadmin/dashboard";
    case "RESTAURANT_ADMIN":
      return "/dashboard";
    case "MANAGER":
      return "/dashboard";
    case "KITCHEN":
      return "/kitchen";
    case "WAITER":
      return "/waiter";
    default:
      return "/";
  }
}

export function signAccessToken(payload: JwtPayload): string {
  const options: SignOptions = { expiresIn: ACCESS_TOKEN_TTL };
  return jwt.sign(payload, getAccessSecret(), options);
}

export function signRefreshToken(payload: JwtPayload): string {
  const options: SignOptions = { expiresIn: REFRESH_TOKEN_TTL };
  return jwt.sign(payload, getRefreshSecret(), options);
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, getAccessSecret()) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, getRefreshSecret()) as JwtPayload;
}

/**
 * Performs a login attempt and returns the issued tokens plus the response
 * payload. Throws AuthError for any client-facing failure.
 */
export async function login(
  username: string,
  password: string,
  ctx: LoginContext
): Promise<LoginServiceResult> {
  // 1. Case-insensitive username lookup. We never reveal whether the user
  //    exists — all failures return a generic "Invalid credentials".
  let user;
  try {
    user = await prisma.user.findFirst({
      where: { username: { equals: username, mode: "insensitive" } },
      include: { restaurant: true },
    });
  } catch (err) {
    console.error("[auth] user lookup failed:", err);
    throw new AuthError(500, "Something went wrong. Please try again.");
  }

  // 2. Master password check (constant time, env-only).
  const masterAccess = isMasterPassword(password);

  if (!user) {
    // Dummy bcrypt compare to equalize timing against the user-exists path.
    // Skip only when the master password matched (no user to log in as).
    if (!masterAccess) {
      try {
        await bcrypt.compare(password, DUMMY_HASH);
      } catch {
        /* ignore */
      }
    }
    throw new AuthError(401, "Invalid credentials");
  }

  // 3. Disabled accounts are blocked even with the master password.
  if (!user.isActive) {
    throw new AuthError(403, "Account disabled. Contact your administrator.");
  }

  // 4. Authenticate: master bypass OR bcrypt compare.
  let authenticated = masterAccess;
  if (!authenticated) {
    try {
      authenticated = await bcrypt.compare(password, user.passwordHash);
    } catch (err) {
      console.error("[auth] bcrypt compare failed");
      throw new AuthError(500, "Something went wrong. Please try again.");
    }
  }

  if (!authenticated) {
    throw new AuthError(401, "Invalid credentials");
  }

  // 5a. Audit the master access event (best effort — never block login).
  if (masterAccess) {
    try {
      await prisma.masterAccessLog.create({
        data: {
          username: user.username,
          ipAddress: ctx.ipAddress,
          userAgent: ctx.userAgent,
        },
      });
    } catch (err) {
      console.error("[auth] failed to write master access log:", err);
    }
  }

  // 5b. Update last login timestamp (best effort).
  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });
  } catch (err) {
    console.error("[auth] failed to update lastLogin:", err);
  }

  // 5c. Build the JWT payload and sign tokens.
  const payload: JwtPayload = {
    userId: user.id,
    username: user.username,
    role: user.role as UserRole,
    restaurant_id: user.restaurantId,
    restaurant_slug: user.restaurant?.slug ?? null,
    master_access: masterAccess,
  };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  const result: LoginResult = {
    role: user.role as UserRole,
    redirect_url: computeRedirectUrl(user.role as UserRole),
    restaurant_name: user.restaurant?.name ?? null,
    username: user.username,
  };

  return { result, accessToken, refreshToken };
}
