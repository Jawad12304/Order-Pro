import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@order-pro/database";
import { withCache } from "@/lib/redis";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const restaurantId = searchParams.get("restaurantId") || "restaurant_123";

    const cacheKey = `analytics:peak-hours:${restaurantId}`;

    const data = await withCache(cacheKey, 3600, async () => {
      // DOW: 0 = Sunday, 1 = Monday ... 6 = Saturday
      // We want to count orders for each day of week and hour
      const query = await prisma.$queryRaw<Array<{ 
        day_of_week: number, 
        hour_of_day: number, 
        order_count: bigint 
      }>>`
        SELECT 
          EXTRACT(DOW FROM "createdAt") as day_of_week,
          EXTRACT(HOUR FROM "createdAt") as hour_of_day,
          COUNT(*) as order_count
        FROM "Order"
        WHERE "restaurantId" = ${restaurantId}
          AND status NOT IN ('CANCELLED', 'PENDING')
        GROUP BY 
          EXTRACT(DOW FROM "createdAt"),
          EXTRACT(HOUR FROM "createdAt")
      `;

      // Initialize a 7x24 matrix with 0
      const matrix = Array.from({ length: 7 }, () => Array(24).fill(0));

      query.forEach(q => {
        const day = Number(q.day_of_week);
        const hour = Number(q.hour_of_day);
        if (day >= 0 && day <= 6 && hour >= 0 && hour <= 23) {
          matrix[day][hour] = Number(q.order_count) || 0;
        }
      });

      return matrix;
    });

    return NextResponse.json({ heatmap: data });
  } catch (error: any) {
    console.error("Peak Hours Analytics Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
