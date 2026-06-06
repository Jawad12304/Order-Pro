import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "@order-pro/database";
import { StaffRole } from "@order-pro/shared";

// Extend Express Request to include our user payload
declare global {
  namespace Express {
    interface Request {
      user?: {
        authUserId: string;
        staffId: string;
        restaurantId: string;
        role: StaffRole;
      };
      restaurant?: {
        id: string;
        slug: string;
      };
    }
  }
}

/**
 * Verifies the Supabase JWT
 */
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid authorization header" });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Supabase signs JWTs with the JWT secret, not the public anon key.
    // Ensure SUPABASE_JWT_SECRET is in your .env
    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET!) as { sub: string };
    
    // Attach authUserId to request, but we don't have the Staff/Restaurant details yet
    (req as any).authUserId = decoded.sub;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

/**
 * Extracts subdomain and validates it against the authenticated user
 * Must be used after requireAuth
 */
export const requireTenant = async (req: Request, res: Response, next: NextFunction) => {
  const authUserId = (req as any).authUserId;
  if (!authUserId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Extract subdomain
  // If host is pizza-palace.localhost:3000 -> pizza-palace
  const host = req.headers.host || "";
  const subdomain = host.split(".")[0];

  if (!subdomain || subdomain === "localhost" || subdomain.includes(":")) {
    return res.status(400).json({ error: "Invalid tenant subdomain" });
  }

  try {
    // Find the restaurant by slug (subdomain)
    const restaurant = await prisma.restaurant.findUnique({
      where: { slug: subdomain },
    });

    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    // Verify the user is staff for this restaurant
    const staff = await prisma.staff.findFirst({
      where: {
        authUserId,
        restaurantId: restaurant.id,
        isActive: true,
      },
    });

    if (!staff) {
      return res.status(403).json({ error: "Access denied to this tenant" });
    }

    req.restaurant = { id: restaurant.id, slug: restaurant.slug };
    req.user = {
      authUserId,
      staffId: staff.id,
      restaurantId: restaurant.id,
      role: staff.role,
    };

    next();
  } catch (error) {
    console.error("Tenant resolution error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Enforces Role-Based Access Control
 * Must be used after requireTenant
 */
export const requireRole = (allowedRoles: StaffRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: "Forbidden: You do not have the required role to perform this action" 
      });
    }

    next();
  };
};
