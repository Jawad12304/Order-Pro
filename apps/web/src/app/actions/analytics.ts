"use server";

import { prisma } from "@order-pro/database";
import { startOfDay, endOfDay, subDays, format } from "date-fns";

export async function getDashboardStats(restaurantId: string) {
  try {
    const today = new Date();
    const startOfToday = startOfDay(today);
    
    // Total Revenue (today)
    const todaysOrders = await prisma.order.findMany({
      where: {
        restaurantId,
        createdAt: { gte: startOfToday },
        status: { not: "CANCELLED" },
      },
    });
    
    const todaysRevenue = todaysOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const activeOrdersCount = todaysOrders.filter(o => o.status !== "PAID" && o.status !== "SERVED").length;
    
    // Hourly Revenue Data (last 12 hours)
    // Simplified aggregation
    const hourlyData = Array.from({ length: 12 }).map((_, i) => {
      const d = new Date();
      d.setHours(d.getHours() - (11 - i));
      const hourLabel = format(d, "h a");
      
      const hourStart = new Date(d);
      hourStart.setMinutes(0, 0, 0);
      const hourEnd = new Date(d);
      hourEnd.setMinutes(59, 59, 999);
      
      const ordersInHour = todaysOrders.filter(o => o.createdAt >= hourStart && o.createdAt <= hourEnd);
      const revenue = ordersInHour.reduce((sum, o) => sum + o.totalAmount, 0);
      
      return { time: hourLabel, revenue, orders: ordersInHour.length };
    });

    // Top Items
    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          restaurantId,
          createdAt: { gte: subDays(today, 7) }
        }
      },
      include: {
        menuItem: true
      }
    });

    const itemCounts: Record<string, { name: string; value: number }> = {};
    orderItems.forEach(item => {
      if (item.menuItem) {
        if (!itemCounts[item.menuItem.id]) {
          itemCounts[item.menuItem.id] = { name: item.menuItem.name, value: 0 };
        }
        itemCounts[item.menuItem.id].value += item.quantity;
      }
    });

    const topItems = Object.values(itemCounts)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return {
      todaysRevenue,
      todaysOrdersCount: todaysOrders.length,
      activeOrdersCount,
      hourlyData,
      topItems
    };
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
    return null;
  }
}
