"use server";

import { prisma } from "@order-pro/database";
import { revalidatePath } from "next/cache";

export async function getSubscriptionPlans() {
  try {
    return await prisma.subscriptionPlan.findMany({
      orderBy: { price: "asc" }
    });
  } catch (error) {
    console.error("Failed to fetch plans:", error);
    return [];
  }
}

export async function createSubscriptionPlan(data: {
  name: string;
  price: string;
  tablesLimit: number;
  ordersLimit: number;
  targetAudience: string;
  isPopular: boolean;
  badgeText?: string;
  badgeColor?: string;
  features: string[];
}) {
  try {
    const plan = await prisma.subscriptionPlan.create({
      data
    });
    revalidatePath("/superadmin/billing");
    revalidatePath("/superadmin/restaurants");
    return { success: true, plan };
  } catch (error: any) {
    console.error("Failed to create plan:", error);
    return { success: false, error: error.message };
  }
}

export async function updateSubscriptionPlan(id: string, data: {
  name: string;
  price: string;
  tablesLimit: number;
  ordersLimit: number;
  targetAudience: string;
  isPopular: boolean;
  badgeText?: string;
  badgeColor?: string;
  features: string[];
}) {
  try {
    const plan = await prisma.subscriptionPlan.update({
      where: { id },
      data
    });
    revalidatePath("/superadmin/billing");
    revalidatePath("/superadmin/restaurants");
    return { success: true, plan };
  } catch (error: any) {
    console.error("Failed to update plan:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteSubscriptionPlan(id: string) {
  try {
    await prisma.subscriptionPlan.delete({
      where: { id }
    });
    revalidatePath("/superadmin/billing");
    revalidatePath("/superadmin/restaurants");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete plan:", error);
    return { success: false, error: error.message };
  }
}

export async function upgradeTenantPlan(restaurantId: string, planId: string) {
  try {
    await prisma.restaurant.update({
      where: { id: restaurantId },
      data: { subscriptionPlanId: planId }
    });
    revalidatePath("/superadmin/billing");
    revalidatePath("/superadmin/restaurants");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to upgrade tenant plan:", error);
    return { success: false, error: error.message };
  }
}
