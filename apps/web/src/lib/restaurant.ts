"use server";

import { prisma } from "@order-pro/database";

/**
 * Resolves the current restaurant for admin dashboard pages.
 *
 * In development / single-tenant mode, this returns the first active restaurant.
 * In production, this should be replaced with auth-aware tenant resolution
 * (e.g., from the logged-in user's Staff record → restaurantId).
 */
export async function getRestaurantId(): Promise<string | null> {
  try {
    const restaurant = await prisma.restaurant.findFirst({
      where: { isActive: true },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    });
    return restaurant?.id ?? null;
  } catch (error) {
    console.error("Failed to resolve restaurant ID:", error);
    return null;
  }
}

/**
 * Resolves the full restaurant record (for pages that need more than just the ID).
 */
export async function getRestaurant() {
  try {
    return await prisma.restaurant.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
    });
  } catch (error) {
    console.error("Failed to resolve restaurant:", error);
    return null;
  }
}

/**
 * Resolves restaurant by slug (used in customer-facing pages).
 */
export async function getRestaurantBySlug(slug: string) {
  try {
    return await prisma.restaurant.findUnique({
      where: { slug },
    });
  } catch (error) {
    console.error("Failed to resolve restaurant by slug:", error);
    return null;
  }
}

/**
 * Resolves a table's CUID from restaurant ID + table number.
 */
export async function getTableId(restaurantId: string, tableNumber: number): Promise<string | null> {
  try {
    const table = await prisma.table.findUnique({
      where: {
        restaurantId_number: {
          restaurantId,
          number: tableNumber,
        },
      },
      select: { id: true },
    });
    return table?.id ?? null;
  } catch (error) {
    console.error("Failed to resolve table ID:", error);
    return null;
  }
}
