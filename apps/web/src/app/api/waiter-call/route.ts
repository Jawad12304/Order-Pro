import { NextRequest, NextResponse } from "next/server";
// In a full production app we would write a "Call" record to the DB or notify staff directly.

export async function POST(req: NextRequest) {
  try {
    const { tableId, restaurantId } = await req.json();

    if (!tableId || !restaurantId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Usually, we would hit our Express websocket server from here to trigger
    // the event securely from backend to backend, but since we are doing a 
    // mock PWA flow, we will just return success and let the frontend emit
    // the socket event for demonstration.

    return NextResponse.json({ success: true, message: "Waiter notified" }, { status: 200 });
  } catch (error: any) {
    console.error("Failed to notify waiter:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
