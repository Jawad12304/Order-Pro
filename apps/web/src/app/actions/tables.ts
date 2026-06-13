"use server";

import { prisma } from "@order-pro/database";
import { revalidatePath } from "next/cache";

export async function getTables(restaurantId: string) {
  try {
    return await prisma.table.findMany({
      where: { restaurantId },
      orderBy: { number: "asc" },
      include: {
        tableSessions: {
          where: { status: "ACTIVE" },
          take: 1,
        },
      },
    });
  } catch (error) {
    console.error("Failed to fetch tables:", error);
    return [];
  }
}

export async function createTable(data: { restaurantId: string; number: number; capacity?: number }) {
  try {
    const table = await prisma.table.create({
      data: {
        restaurantId: data.restaurantId,
        number: data.number,
        capacity: data.capacity || 4,
      },
    });
    revalidatePath("/dashboard/tables");
    return table;
  } catch (error) {
    console.error("Failed to create table:", error);
    throw new Error("Failed to create table");
  }
}

export async function deleteTable(id: string) {
  try {
    await prisma.table.delete({
      where: { id },
    });
    revalidatePath("/dashboard/tables");
  } catch (error) {
    console.error("Failed to delete table:", error);
    throw new Error("Failed to delete table");
  }
}
