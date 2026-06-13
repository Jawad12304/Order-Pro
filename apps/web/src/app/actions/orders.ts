"use server";

import { prisma } from "@order-pro/database";
import { revalidatePath } from "next/cache";

export async function getRecentOrders(restaurantId: string, take: number = 5) {
  try {
    return await prisma.order.findMany({
      where: { restaurantId },
      include: {
        table: true,
        items: {
          include: {
            menuItem: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take,
    });
  } catch (error) {
    console.error("Failed to fetch recent orders:", error);
    return [];
  }
}

export async function getActiveOrders(restaurantId: string) {
  try {
    return await prisma.order.findMany({
      where: { 
        restaurantId,
        status: {
          notIn: ["PAID", "CANCELLED"]
        }
      },
      include: {
        table: true,
        items: {
          include: {
            menuItem: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Failed to fetch active orders:", error);
    return [];
  }
}

export async function placeOrder(data: {
  restaurantId: string;
  tableId?: string | null;
  customerName?: string;
  items: { menuItemId: string; quantity: number; unitPrice: number; modifiersJson?: any; specialInstructions?: string }[];
}) {
  try {
    const subtotal = data.items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
    const tax = subtotal * 0.1; // 10% tax for example
    const total = subtotal + tax;

    const order = await prisma.order.create({
      data: {
        restaurantId: data.restaurantId,
        tableId: data.tableId || undefined,
        customerName: data.customerName,
        subtotalAmount: subtotal,
        taxAmount: tax,
        totalAmount: total,
        status: "PENDING",
        items: {
          create: data.items,
        },
      },
    });

    revalidatePath("/dashboard/orders");
    return order;
  } catch (error) {
    console.error("Failed to place order:", error);
    throw new Error("Failed to place order");
  }
}

export async function updateOrderStatus(orderId: string, status: string) {
  try {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status: status as any },
      include: {
        table: true,
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    });
    revalidatePath("/dashboard/orders");
    revalidatePath("/dashboard");
    return order;
  } catch (error) {
    console.error("Failed to update order status:", error);
    throw new Error("Failed to update order status");
  }
}

