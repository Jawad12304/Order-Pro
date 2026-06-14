export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@order-pro/database";
import { withCache } from "@/lib/redis";
import { getRestaurantId } from "@/lib/restaurant";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const restaurantId = searchParams.get("restaurantId") || await getRestaurantId();
    if (!restaurantId) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    const cacheKey = `analytics:tables:${restaurantId}`;

    const data = await withCache(cacheKey, 1800, async () => {
      // Analyze Session duration (average) and Revenue per table
      const query = await prisma.$queryRaw<Array<{ 
        table_number: number, 
        total_sessions: bigint, 
        avg_duration_minutes: number,
        total_revenue: number 
      }>>`
        SELECT 
          t."number" as table_number,
          COUNT(ts.id) as total_sessions,
          AVG(EXTRACT(EPOCH FROM (ts."endedAt" - ts."startedAt"))/60) as avg_duration_minutes,
          SUM(o."totalAmount") as total_revenue
        FROM "Table" t
        LEFT JOIN "TableSession" ts ON ts."tableId" = t.id AND ts.status = 'COMPLETED'
        LEFT JOIN "Order" o ON o."tableSessionId" = ts.id AND o.status = 'COMPLETED'
        WHERE t."restaurantId" = ${restaurantId}
        GROUP BY t.id, t."number"
        ORDER BY total_revenue DESC
      `;

      return query.map(q => ({
        table: q.table_number,
        sessions: Number(q.total_sessions) || 0,
        avgDurationMinutes: Number(q.avg_duration_minutes) || 0,
        revenue: Number(q.total_revenue) || 0,
      }));
    });

    return NextResponse.json({ tables: data });
  } catch (error: any) {
    console.error("Tables Analytics Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

