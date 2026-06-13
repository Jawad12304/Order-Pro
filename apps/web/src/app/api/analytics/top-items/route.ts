import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@order-pro/database";
import { withCache } from "@/lib/redis";
import { getRestaurantId } from "@/lib/restaurant";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const restaurantId = searchParams.get("restaurantId") || await getRestaurantId();
    if (!restaurantId) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    const cacheKey = `analytics:top-items:${restaurantId}:${limit}`;

    const data = await withCache(cacheKey, 1800, async () => {
      // Group by menuItemId across all valid orders
      const query = await prisma.$queryRaw<Array<{ 
        menuItemId: string, 
        name: string, 
        total_quantity: bigint, 
        total_revenue: number 
      }>>`
        SELECT 
          oi."menuItemId", 
          mi.name,
          SUM(oi.quantity) as total_quantity,
          SUM(oi.quantity * oi."unitPrice") as total_revenue
        FROM "OrderItem" oi
        JOIN "Order" o ON o.id = oi."orderId"
        JOIN "MenuItem" mi ON mi.id = oi."menuItemId"
        WHERE o."restaurantId" = ${restaurantId}
          AND o.status NOT IN ('CANCELLED', 'PENDING')
        GROUP BY oi."menuItemId", mi.name
        ORDER BY total_quantity DESC
        LIMIT ${limit}
      `;

      return query.map(q => ({
        id: q.menuItemId,
        name: q.name,
        quantity: Number(q.total_quantity) || 0,
        revenue: Number(q.total_revenue) || 0,
      }));
    });

    return NextResponse.json({ items: data });
  } catch (error: any) {
    console.error("Top Items Analytics Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
