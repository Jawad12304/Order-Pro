import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@order-pro/database";
import { withCache } from "@/lib/redis";
import { getRestaurantId } from "@/lib/restaurant";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const startStr = searchParams.get("start");
    const endStr = searchParams.get("end");
    const restaurantId = searchParams.get("restaurantId") || await getRestaurantId();
    if (!restaurantId) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    if (!startStr || !endStr) {
      return NextResponse.json({ error: "Missing start or end date" }, { status: 400 });
    }

    const startDate = new Date(startStr);
    const endDate = new Date(endStr);
    
    // Ensure end date covers the whole day
    endDate.setHours(23, 59, 59, 999);

    const cacheKey = `analytics:revenue:${restaurantId}:${startStr}:${endStr}`;

    const data = await withCache(cacheKey, 1800, async () => {
      // Get the daily grouping
      const dailyQuery = await prisma.$queryRaw<Array<{ date: Date, revenue: number, orders: bigint }>>`
        SELECT 
          DATE_TRUNC('day', "createdAt") as date, 
          COALESCE(SUM("totalAmount"), 0) as revenue,
          COUNT(*) as orders
        FROM "Order"
        WHERE "restaurantId" = ${restaurantId}
          AND "status" NOT IN ('CANCELLED', 'PENDING')
          AND "createdAt" >= ${startDate}
          AND "createdAt" <= ${endDate}
        GROUP BY DATE_TRUNC('day', "createdAt")
        ORDER BY date ASC
      `;

      // Get overall totals
      const totalsQuery = await prisma.$queryRaw<Array<{ total_revenue: number, total_orders: bigint }>>`
        SELECT 
          COALESCE(SUM("totalAmount"), 0) as total_revenue,
          COUNT(*) as total_orders
        FROM "Order"
        WHERE "restaurantId" = ${restaurantId}
          AND "status" NOT IN ('CANCELLED', 'PENDING')
          AND "createdAt" >= ${startDate}
          AND "createdAt" <= ${endDate}
      `;

      const totals = totalsQuery[0] || { total_revenue: 0, total_orders: BigInt(0) };
      const totalRevenue = Number(totals.total_revenue) || 0;
      const totalOrders = Number(totals.total_orders) || 0;

      return {
        totalRevenue,
        totalOrders,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        daily: dailyQuery.map(d => ({
          date: d.date.toISOString().split("T")[0],
          revenue: Number(d.revenue) || 0,
          orders: Number(d.orders) || 0,
        }))
      };
    });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Revenue Analytics Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
