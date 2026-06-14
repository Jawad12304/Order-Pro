export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@order-pro/database";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { restaurantId, tableId, customerName, notes, items, subtotalAmount, taxAmount, totalAmount } = body;

    if (!restaurantId || !customerName || !items || !items.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const order = await prisma.order.create({
      data: {
        restaurantId,
        tableId: tableId || null,
        customerName,
        notes,
        status: "PENDING",
        subtotalAmount,
        taxAmount,
        totalAmount,
        items: {
          create: items.map((item: any) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            specialInstructions: item.specialInstructions || null,
            modifiersJson: item.modifiersJson || null,
          })),
        },
      },
    });

    return NextResponse.json({ success: true, orderId: order.id }, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create order:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

