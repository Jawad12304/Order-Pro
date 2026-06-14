// ==========================================
// Order-Pro — Edge Middleware (Custom JWT Auth)
//
// Reads the mq_access_token httpOnly cookie, verifies it with jose (Edge-
// compatible), and enforces role-based route protection. If the token is
// missing or invalid the user is redirected to "/".
// ==========================================

import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

type UserRole =
  | "SUPER_ADMIN"
  | "RESTAURANT_ADMIN"
  | "MANAGER"
  | "KITCHEN"
  | "WAITER";

interface JwtPayload {
  userId: string;
  username: string;
  role: UserRole;
  restaurant_id: string | null;
  restaurant_slug: string | null;
  master_access: boolean;
}

const ACCESS_COOKIE = "mq_access_token";

function getSecret(): Uint8Array {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) {
    throw new Error("JWT_ACCESS_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
}

/** Attempt to decode + verify the access token from the cookie. */
async function getTokenPayload(
  request: NextRequest
): Promise<JwtPayload | null> {
  const token = request.cookies.get(ACCESS_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as JwtPayload;
  } catch {
    // Expired or invalid — fall through to redirect
    return null;
  }
}

/** Maps a role to its default landing page. */
function defaultRedirect(role: UserRole): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "/superadmin";
    case "RESTAURANT_ADMIN":
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

// ==========================================
// Role → allowed route prefixes
// ==========================================

const ROUTE_ROLES: { prefix: string; allowed: UserRole[] }[] = [
  {
    prefix: "/superadmin",
    allowed: ["SUPER_ADMIN"],
  },
  {
    prefix: "/dashboard",
    allowed: ["RESTAURANT_ADMIN", "MANAGER"],
  },
  {
    prefix: "/kitchen",
    allowed: ["KITCHEN", "RESTAURANT_ADMIN", "SUPER_ADMIN"],
  },
  {
    prefix: "/waiter",
    allowed: ["WAITER", "RESTAURANT_ADMIN", "SUPER_ADMIN"],
  },
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const user = await getTokenPayload(request);

  // ----- Public login page -----
  // If the user already has a valid token and visits "/", redirect to their
  // default dashboard instead of showing the login page.
  if (pathname === "/") {
    if (user) {
      const url = request.nextUrl.clone();
      url.pathname = defaultRedirect(user.role);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // ----- Protected routes -----
  for (const route of ROUTE_ROLES) {
    if (pathname.startsWith(route.prefix)) {
      // No token → redirect to login
      if (!user) {
        const url = request.nextUrl.clone();
        url.pathname = "/";
        return NextResponse.redirect(url);
      }

      // Token exists but wrong role → redirect to their own dashboard
      if (!route.allowed.includes(user.role)) {
        const url = request.nextUrl.clone();
        url.pathname = defaultRedirect(user.role);
        return NextResponse.redirect(url);
      }

      // Authorized — pass through
      return NextResponse.next();
    }
  }

  // Everything else (public customer pages, API routes, etc.) — pass through.
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for static assets:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static assets (svg, png, jpg, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
