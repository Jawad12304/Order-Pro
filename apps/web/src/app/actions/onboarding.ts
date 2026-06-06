"use server";

import { createClient } from "@/utils/supabase/server";
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

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Not authenticated" };
  }

  try {
    // Check if the staff already exists with this user
    let staff = await prisma.staff.findUnique({
      where: { authUserId: user.id },
    });

    if (staff) {
      return { error: "You already have a restaurant associated with this account." };
    }

    // 1. Create the restaurant
    const slug = generateSlug(name) + "-" + Math.random().toString(36).substring(2, 6);
    const restaurant = await prisma.restaurant.create({
      data: {
        name,
        slug,
        themeColor: themeColor || "#F97316",
        currency: currency || "USD",
        subscriptionPlan: "FREE",
      },
    });

    // 2. Create the Staff / Owner
    staff = await prisma.staff.create({
      data: {
        authUserId: user.id,
        restaurantId: restaurant.id,
        name: user.email?.split("@")[0] || "Owner",
        email: user.email,
        role: "OWNER",
        isActive: true,
      },
    });

    return { success: true, restaurantId: restaurant.id };
  } catch (error: any) {
    console.error("Error creating restaurant:", error);
    return { error: error.message || "Failed to create restaurant" };
  }
}

export async function createFirstTableAction(restaurantId: string, formData: FormData) {
  const numberStr = formData.get("tableNumber") as string;
  const capacityStr = formData.get("capacity") as string;

  if (!numberStr) {
    return { error: "Table number is required" };
  }

  const number = parseInt(numberStr, 10);
  const capacity = parseInt(capacityStr, 10) || 4;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  try {
    // Create the table
    await prisma.table.create({
      data: {
        restaurantId,
        number,
        capacity,
        status: "AVAILABLE",
      },
    });

    // redirect to dashboard on success
  } catch (error: any) {
    console.error("Error creating table:", error);
    return { error: error.message || "Failed to create table" };
  }

  redirect("/dashboard");
}
