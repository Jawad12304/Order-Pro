"use server";

import { prisma } from "@order-pro/database";
import { revalidatePath } from "next/cache";

export async function getFeatureFlags() {
  try {
    return await prisma.featureFlag.findMany({
      orderBy: { createdAt: "asc" }
    });
  } catch (error) {
    console.error("Failed to fetch feature flags:", error);
    return [];
  }
}

export async function createFeatureFlag(data: {
  key: string;
  name: string;
  description?: string;
  defaultValue: boolean;
}) {
  try {
    const flag = await prisma.featureFlag.create({
      data
    });
    revalidatePath("/superadmin/features");
    return { success: true, flag };
  } catch (error: any) {
    console.error("Failed to create feature flag:", error);
    return { success: false, error: error.message };
  }
}

export async function updateFeatureFlag(id: string, data: {
  key: string;
  name: string;
  description?: string;
  defaultValue: boolean;
}) {
  try {
    const flag = await prisma.featureFlag.update({
      where: { id },
      data
    });
    revalidatePath("/superadmin/features");
    return { success: true, flag };
  } catch (error: any) {
    console.error("Failed to update feature flag:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteFeatureFlag(id: string) {
  try {
    await prisma.featureFlag.delete({
      where: { id }
    });
    revalidatePath("/superadmin/features");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete feature flag:", error);
    return { success: false, error: error.message };
  }
}

export async function getTenantsForFeatures() {
  try {
    return await prisma.restaurant.findMany({
      select: {
        id: true,
        name: true,
        settingsJson: true,
        subscriptionPlan: {
          select: { name: true }
        }
      },
      orderBy: { name: "asc" }
    });
  } catch (error) {
    console.error("Failed to fetch tenants for features:", error);
    return [];
  }
}

export async function toggleTenantFeatureFlag(restaurantId: string, featureKey: string, newValue: boolean) {
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { settingsJson: true }
    });

    if (!restaurant) throw new Error("Restaurant not found");

    const settings: any = restaurant.settingsJson || {};
    settings.featureFlags = settings.featureFlags || {};
    settings.featureFlags[featureKey] = newValue;

    await prisma.restaurant.update({
      where: { id: restaurantId },
      data: { settingsJson: settings }
    });

    revalidatePath("/superadmin/features");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to toggle tenant feature flag:", error);
    return { success: false, error: error.message };
  }
}
