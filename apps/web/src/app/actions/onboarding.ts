"use server";

// ==========================================
// Order-Pro — Onboarding Server Actions
//
// NOTE: These actions previously used Supabase auth to verify the caller.
// With the JWT/cookie auth pivot, server actions cannot read httpOnly
// cookies in the same way. These are stubbed out — onboarding flow should
// be rebuilt to call the Express API endpoints (which handle auth via
// cookies automatically).
// ==========================================

import { prisma } from "@order-pro/database";
import { generateSlug } from "@order-pro/shared";
import { redirect } from "next/navigation";

export async function createRestaurantAction(formData: FormData) {
  const name = formData.get("name") as string;
  const themeColor = formData.get("themeColor") as string;
  const currency = formData.get("currency") as string;

  if (!name) {
    return { error: "Restaurant name is required" };
  }

  // TODO: Authentication should be handled by the Express API.
  // This server action is a placeholder for the onboarding flow migration.
  // For now, return an error directing the user to the proper flow.
  return { error: "Onboarding is not yet available. Please contact the Super Admin." };
}

export async function createFirstTableAction(restaurantId: string, formData: FormData) {
  const numberStr = formData.get("tableNumber") as string;
  const capacityStr = formData.get("capacity") as string;

  if (!numberStr) {
    return { error: "Table number is required" };
  }

  const number = parseInt(numberStr, 10);
  const capacity = parseInt(capacityStr, 10) || 4;

  // TODO: Authentication should be handled by the Express API.
  // This server action is a placeholder for the onboarding flow migration.
  return { error: "Onboarding is not yet available. Please contact the Super Admin." };
}
