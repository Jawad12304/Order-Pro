// ==========================================
// MenuQR — Auth Types & Validation Schemas
// ==========================================

import { z } from "zod";

// Mirrors the Prisma UserRole enum.
export const UserRoleEnum = z.enum([
  "SUPER_ADMIN",
  "RESTAURANT_ADMIN",
  "MANAGER",
  "KITCHEN",
  "WAITER",
]);
export type UserRole = z.infer<typeof UserRoleEnum>;

// Roles a RESTAURANT_ADMIN is allowed to create.
export const CreatableUserRoleEnum = z.enum(["MANAGER", "KITCHEN", "WAITER"]);
export type CreatableUserRole = z.infer<typeof CreatableUserRoleEnum>;

// ==========================================
// JWT payload
// ==========================================

export interface JwtPayload {
  userId: string;
  username: string;
  role: UserRole;
  restaurant_id: string | null;
  restaurant_slug: string | null;
  master_access: boolean;
}

// ==========================================
// Request validation schemas
// ==========================================

export const LoginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be at most 50 characters"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password must be at most 100 characters"),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const CreateUserSchema = z.object({
  username: z.string().trim().min(3).max(50),
  email: z.string().email().max(100).optional(),
  password: z.string().min(6).max(100),
  role: CreatableUserRoleEnum,
});
export type CreateUserInput = z.infer<typeof CreateUserSchema>;

export const UpdatePasswordSchema = z.object({
  new_password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100),
});
export type UpdatePasswordInput = z.infer<typeof UpdatePasswordSchema>;

// ==========================================
// Standard API response envelope
// ==========================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface LoginResult {
  role: UserRole;
  redirect_url: string;
  restaurant_name: string | null;
  username: string;
}

// ==========================================
// Express Request augmentation
// ==========================================

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      authUser?: JwtPayload;
    }
  }
}
