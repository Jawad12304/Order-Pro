"use server";

import { prisma } from "@order-pro/database";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);

export async function getAdminProfile(username: string) {
  try {
    const user = await prisma.user.findFirst({
      where: { username: { equals: username, mode: "insensitive" } },
      select: {
        username: true,
        avatarUrl: true,
        restaurantId: true,
        role: true,
        restaurant: {
          select: {
            name: true
          }
        }
      }
    });
    return user;
  } catch (error) {
    console.error("Failed to get profile:", error);
    return null;
  }
}

export async function updateAdminProfile(username: string, data: { newUsername: string, avatarUrl: string | null }) {
  try {
    const user = await prisma.user.findFirst({
      where: { username: { equals: username, mode: "insensitive" } }
    });
    if (!user) throw new Error("User not found");

    await prisma.user.update({
      where: { id: user.id },
      data: {
        username: data.newUsername.trim(),
        avatarUrl: data.avatarUrl
      }
    });

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to update profile:", error);
    return { success: false, error: error.message };
  }
}

export async function changeAdminPassword(username: string, newPassword: string) {
  try {
    const user = await prisma.user.findFirst({
      where: { username: { equals: username, mode: "insensitive" } }
    });
    if (!user) throw new Error("User not found");

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash }
    });

    return { success: true };
  } catch (error: any) {
    console.error("Failed to change password:", error);
    return { success: false, error: error.message };
  }
}

export async function generateLocalBackup(restaurantId: string) {
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        categories: { include: { items: true } },
        tables: true,
        orders: { take: 100, orderBy: { createdAt: 'desc' } }
      }
    });

    if (!restaurant) throw new Error("Restaurant not found");

    return {
      success: true,
      data: JSON.stringify(restaurant, null, 2)
    };
  } catch (error: any) {
    console.error("Failed to generate backup:", error);
    return { success: false, error: error.message };
  }
}

export async function updateRestaurantName(restaurantId: string, name: string) {
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId }
    });
    if (!restaurant) throw new Error("Restaurant not found");

    await prisma.restaurant.update({
      where: { id: restaurantId },
      data: { name: name.trim() }
    });

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to update restaurant name:", error);
    return { success: false, error: error.message };
  }
}
