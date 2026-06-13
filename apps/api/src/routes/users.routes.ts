// ==========================================
// MenuQR — User Management Routes
//
// All routes require RESTAURANT_ADMIN or SUPER_ADMIN. A RESTAURANT_ADMIN is
// always scoped to their own restaurant_id (from the JWT). A SUPER_ADMIN may
// target any restaurant via the ?restaurant_id query param.
// ==========================================

import { Router, Request, Response } from "express";
import { ZodError } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@order-pro/database";
import {
  requireAuth,
  requireRole,
  resolveRestaurantScope,
} from "../middleware/auth.middleware";
import {
  CreateUserSchema,
  UpdatePasswordSchema,
} from "../types/auth.types";
import type { ApiResponse } from "../types/auth.types";

const router = Router();

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);

// Fields safe to return to the client (never password_hash).
const PUBLIC_USER_SELECT = {
  id: true,
  username: true,
  email: true,
  role: true,
  isActive: true,
  lastLogin: true,
  createdAt: true,
} as const;

function fail(res: Response, status: number, error: string): void {
  const body: ApiResponse = { success: false, error };
  res.status(status).json(body);
}

// Every route here requires admin-level access.
router.use(requireAuth, requireRole(["RESTAURANT_ADMIN", "SUPER_ADMIN"]));

// ------------------------------------------
// GET /api/users
// ------------------------------------------
router.get("/", async (req: Request, res: Response) => {
  try {
    const restaurantId = resolveRestaurantScope(req);
    if (!restaurantId) {
      // SUPER_ADMIN must specify which restaurant to view.
      return fail(res, 400, "A restaurant_id is required.");
    }

    const users = await prisma.user.findMany({
      where: { restaurantId },
      select: PUBLIC_USER_SELECT,
      orderBy: { createdAt: "desc" },
    });

    const body: ApiResponse = { success: true, data: users };
    res.status(200).json(body);
  } catch (err) {
    console.error("[users] list error:", err);
    fail(res, 500, "Failed to load users.");
  }
});

// ------------------------------------------
// POST /api/users
// ------------------------------------------
router.post("/", async (req: Request, res: Response) => {
  try {
    const restaurantId = resolveRestaurantScope(req);
    if (!restaurantId) {
      return fail(res, 400, "A restaurant_id is required.");
    }

    const { username, email, password, role } = CreateUserSchema.parse(
      req.body
    );

    // Enforce uniqueness within the restaurant.
    const existing = await prisma.user.findFirst({
      where: {
        restaurantId,
        username: { equals: username, mode: "insensitive" },
      },
    });
    if (existing) {
      return fail(res, 409, "A user with that username already exists.");
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const created = await prisma.user.create({
      data: {
        username,
        email: email ?? null,
        passwordHash,
        role,
        restaurantId,
        createdBy: req.authUser!.userId,
      },
      select: PUBLIC_USER_SELECT,
    });

    const body: ApiResponse = { success: true, data: created };
    res.status(201).json(body);
  } catch (err) {
    if (err instanceof ZodError) {
      return fail(res, 400, err.errors[0]?.message ?? "Invalid input");
    }
    console.error("[users] create error:", err);
    fail(res, 500, "Failed to create user.");
  }
});

// ------------------------------------------
// Helper: load a target user within the requester's scope
// ------------------------------------------
async function loadScopedUser(req: Request) {
  const restaurantId = resolveRestaurantScope(req);
  if (!restaurantId) return { error: "A restaurant_id is required." as const };

  const target = await prisma.user.findUnique({
    where: { id: req.params.userId },
  });
  if (!target || target.restaurantId !== restaurantId) {
    return { error: "User not found." as const };
  }
  return { user: target };
}

// ------------------------------------------
// PATCH /api/users/:userId/password
// ------------------------------------------
router.patch("/:userId/password", async (req: Request, res: Response) => {
  try {
    const { new_password } = UpdatePasswordSchema.parse(req.body);

    const scoped = await loadScopedUser(req);
    if ("error" in scoped) {
      return fail(res, 404, scoped.error);
    }

    const passwordHash = await bcrypt.hash(new_password, SALT_ROUNDS);
    await prisma.user.update({
      where: { id: scoped.user.id },
      data: { passwordHash },
    });

    const body: ApiResponse = { success: true };
    res.status(200).json(body);
  } catch (err) {
    if (err instanceof ZodError) {
      return fail(res, 400, err.errors[0]?.message ?? "Invalid input");
    }
    console.error("[users] password update error:", err);
    fail(res, 500, "Failed to update password.");
  }
});

// ------------------------------------------
// PATCH /api/users/:userId/toggle
// ------------------------------------------
router.patch("/:userId/toggle", async (req: Request, res: Response) => {
  try {
    const scoped = await loadScopedUser(req);
    if ("error" in scoped) {
      return fail(res, 404, scoped.error);
    }

    const updated = await prisma.user.update({
      where: { id: scoped.user.id },
      data: { isActive: !scoped.user.isActive },
      select: PUBLIC_USER_SELECT,
    });

    const body: ApiResponse = { success: true, data: updated };
    res.status(200).json(body);
  } catch (err) {
    console.error("[users] toggle error:", err);
    fail(res, 500, "Failed to update user.");
  }
});

// ------------------------------------------
// DELETE /api/users/:userId  (soft delete)
// ------------------------------------------
router.delete("/:userId", async (req: Request, res: Response) => {
  try {
    const scoped = await loadScopedUser(req);
    if ("error" in scoped) {
      return fail(res, 404, scoped.error);
    }

    await prisma.user.update({
      where: { id: scoped.user.id },
      data: { isActive: false },
    });

    const body: ApiResponse = { success: true };
    res.status(200).json(body);
  } catch (err) {
    console.error("[users] delete error:", err);
    fail(res, 500, "Failed to delete user.");
  }
});

export default router;
