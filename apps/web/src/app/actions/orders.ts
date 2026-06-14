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

export async function getMyOrders(restaurantId: string, orderIds: string[], tableId?: string | null) {
  try {
    // Build an OR condition: either the order ID is in our session, OR it belongs to our table.
    const conditions: any[] = [];
    if (orderIds && orderIds.length > 0) {
      conditions.push({ id: { in: orderIds } });
    }
    if (tableId) {
      conditions.push({ tableId: tableId });
    }

    if (conditions.length === 0) return []; // Nothing to look for

    return await prisma.order.findMany({
      where: {
        restaurantId,
        OR: conditions,
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
    console.error("Failed to fetch my orders:", error);
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
    console.log("PLACE ORDER PAYLOAD:", JSON.stringify(data, null, 2));

    // Validate menu items exist to prevent foreign key errors from stale local cache
    const menuItemIds = data.items.map(item => item.menuItemId);
    const existingItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds } },
      select: { id: true }
    });
    const validIds = new Set(existingItems.map(item => item.id));
    const validItems = data.items.filter(item => validIds.has(item.menuItemId));

    if (validItems.length === 0) {
      throw new Error("No valid items in the order. Please clear your cart and try again.");
    }

    const subtotal = validItems.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
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
          create: validItems,
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

