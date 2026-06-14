"use server";

import { prisma, UserRole } from "@order-pro/database";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);

export async function getRestaurantsAdmin() {
  try {
    const restaurants = await prisma.restaurant.findMany({
      include: {
        users: {
          where: { role: "RESTAURANT_ADMIN" },
          select: { username: true }
        },
        subscriptionPlan: true,
        _count: {
          select: { tables: true, orders: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return restaurants.map(r => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      adminUsername: r.users[0]?.username || "No Admin",
      plan: r.subscriptionPlan?.name || "No Plan",
      planId: r.subscriptionPlanId,
      tablesCount: r._count.tables,
      ordersCount: r._count.orders,
      status: r.isActive ? "Active" : "Suspended",
      joined: r.createdAt.toISOString().split("T")[0]
    }));
  } catch (error) {
    console.error("Failed to fetch restaurants:", error);
    return [];
  }
}

export async function createRestaurant(data: {
  name: string;
  slug: string;
  planId: string;
  adminUsername: string;
  adminPassword: string;
}) {
  try {
    const safeUsername = data.adminUsername.trim();
    const safePassword = data.adminPassword; // Don't trim password as spaces can be valid, but make sure the UI matches

    const passwordHash = await bcrypt.hash(safePassword, SALT_ROUNDS);

    // Run in transaction to ensure both or neither are created
    const restaurant = await prisma.$transaction(async (tx) => {
      const newRest = await tx.restaurant.create({
        data: {
          name: data.name,
          slug: data.slug,
          subscriptionPlanId: data.planId,
          isActive: true,
        }
      });

      await tx.user.create({
        data: {
          username: safeUsername,
          passwordHash,
          role: "RESTAURANT_ADMIN",
          restaurantId: newRest.id,
          isActive: true
        }
      });

      return newRest;
    });

    revalidatePath("/superadmin/restaurants");
    return { success: true, restaurant };
  } catch (error: any) {
    console.error("Failed to create restaurant:", error);
    return { success: false, error: error.message };
  }
}

export async function updateRestaurant(id: string, data: {
  name: string;
  planId: string;
  adminUsername: string;
  adminPassword?: string;
  isActive: boolean;
}) {
  try {
    const safeUsername = data.adminUsername.trim();
    await prisma.$transaction(async (tx) => {
      await tx.restaurant.update({
        where: { id },
        data: {
          name: data.name,
          subscriptionPlanId: data.planId,
          isActive: data.isActive
        }
      });

      const adminUser = await tx.user.findFirst({
        where: { restaurantId: id, role: "RESTAURANT_ADMIN" }
      });

      if (adminUser) {
        const updateData: any = { username: safeUsername, isActive: data.isActive };
        if (data.adminPassword) {
          updateData.passwordHash = await bcrypt.hash(data.adminPassword, SALT_ROUNDS);
        }
        await tx.user.update({
          where: { id: adminUser.id },
          data: updateData
        });
      }
    });

    revalidatePath("/superadmin/restaurants");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to update restaurant:", error);
    return { success: false, error: error.message };
  }
}

export async function toggleRestaurantStatus(id: string, currentStatus: boolean) {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.restaurant.update({
        where: { id },
        data: { isActive: !currentStatus }
      });
      // Also cascade to admin users
      await tx.user.updateMany({
        where: { restaurantId: id },
        data: { isActive: !currentStatus }
      });
    });

    revalidatePath("/superadmin/restaurants");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to toggle status:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteRestaurant(id: string) {
  try {
    await prisma.restaurant.delete({
      where: { id }
    });
    revalidatePath("/superadmin/restaurants");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete restaurant:", error);
    return { success: false, error: error.message };
  }
}
