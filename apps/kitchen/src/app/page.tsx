"use client";

import React, { useEffect, useState, useRef } from "react";
import { ChefHat, Clock, AlertTriangle, CheckCircle2, Play, Check, Flame, Wifi, WifiOff } from "lucide-react";
import { useSocket } from "@/context/SocketContext";
import { Order, OrderStatus, formatCurrency } from "@order-pro/shared";

// Mock initial orders to populate KDS immediately for validation
const INITIAL_ORDERS: Order[] = [
  {
    id: "ord_101",
    restaurantId: "rest_alpha",
    tableId: "Table 5",
    status: "PENDING",
    customerName: "Alice Smith",
    items: [
      { menuItemId: "p_1", name: "Truffle Burger", unitPrice: 18.50, quantity: 2, specialInstructions: "No onions" },
      { menuItemId: "p_3", name: "Sweet Potato Fries", unitPrice: 6.00, quantity: 1 }
    ],
    totalAmount: 43.00,
    subtotalAmount: 39.81,
    taxAmount: 3.19,
    createdAt: new Date(Date.now() - 8 * 60 * 1000), // 8 mins ago
    updatedAt: new Date(Date.now() - 8 * 60 * 1000)
  },
  {
    id: "ord_102",
    restaurantId: "rest_alpha",
    tableId: "Table 2",
    status: "PREPARING",
    customerName: "Bob Jones",
    items: [
      { menuItemId: "p_2", name: "Spicy Tuna Roll", unitPrice: 16.00, quantity: 3, specialInstructions: "Extra ginger" },
      { menuItemId: "p_4", name: "Edamame", unitPrice: 5.00, quantity: 2 }
    ],
    totalAmount: 58.00,
    subtotalAmount: 53.70,
    taxAmount: 4.30,
    createdAt: new Date(Date.now() - 15 * 60 * 1000), // 15 mins ago
    updatedAt: new Date(Date.now() - 15 * 60 * 1000)
  },
  {
    id: "ord_103",
    restaurantId: "rest_alpha",
    tableId: "Table 9",
    status: "READY",
    customerName: "Carol White",
    items: [
      { menuItemId: "p_5", name: "Ribeye Steak", unitPrice: 34.00, quantity: 1, specialInstructions: "Medium rare" },
      { menuItemId: "p_6", name: "Caesar Salad", unitPrice: 12.00, quantity: 1 }
    ],
    totalAmount: 46.00,
    subtotalAmount: 42.59,
    taxAmount: 3.41,
    createdAt: new Date(Date.now() - 25 * 60 * 1000), // 25 mins ago
    updatedAt: new Date(Date.now() - 25 * 60 * 1000)
  }
];

export default function KitchenPage() {
  const { socket, isConnected } = useSocket();
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!socket) return;

    // Join the default restaurant workspace
    socket.emit("join-restaurant", "rest_alpha");

    // Listen for new orders
    socket.on("order-received", (newOrderData: any) => {
      console.log("[KDS] Order received:", newOrderData);
      
      const subtotal = newOrderData.items?.reduce((acc: number, item: any) => acc + (item.unitPrice * item.quantity), 0) || 0;
      const parsedOrder: Order = {
        id: newOrderData.orderId || `ord_${Math.random().toString(36).substr(2, 9)}`,
        restaurantId: newOrderData.restaurantId,
        tableId: newOrderData.tableId || "Express/Takeout",
        status: "PENDING",
        customerName: newOrderData.customerName || "Customer",
        items: newOrderData.items || [],
        subtotalAmount: subtotal,
        taxAmount: 0,
        totalAmount: subtotal,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      setOrders((prev) => [parsedOrder, ...prev]);

      // Play alert chime sound
      if (audioRef.current) {
        audioRef.current.play().catch(e => console.log("Audio play blocked by browser config", e));
      }
    });

    // Listen for status changes
    socket.on("order-status-updated", (data: { orderId: string; status: OrderStatus }) => {
      setOrders((prev) =>
        prev.map((order) =>
          order.id === data.orderId
            ? { ...order, status: data.status, updatedAt: new Date() }
            : order
        )
      );
    });

    return () => {
      socket.off("order-received");
      socket.off("order-status-updated");
    };
  }, [socket]);

  // Update order status and emit event
  const updateStatus = (orderId: string, currentStatus: OrderStatus) => {
    let nextStatus: OrderStatus = "PENDING";
    if (currentStatus === "PENDING") nextStatus = "PREPARING";
    else if (currentStatus === "PREPARING") nextStatus = "READY";
    else if (currentStatus === "READY") nextStatus = "SERVED";

    // Update locally first
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? { ...order, status: nextStatus, updatedAt: new Date() }
          : order
      )
    );

    // Emit to websockets
    if (socket) {
      socket.emit("update-order-status", {
        restaurantId: "rest_alpha",
        orderId,
        status: nextStatus
      });
    }
  };

  // Helper to compute minutes elapsed
  const getMinutesElapsed = (createdAt: Date) => {
    const elapsedMs = Date.now() - new Date(createdAt).getTime();
    return Math.floor(elapsedMs / 60000);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans flex flex-col justify-between selection:bg-orange-500 selection:text-white">
      {/* Hidden alert audio chime */}
      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-600.wav" preload="auto" />

      {/* Header */}
      <header className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 shadow-md">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-none tracking-tight">Kitchen Display Screen (KDS)</h1>
            <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Restaurant Station Alpha</span>
          </div>
        </div>

        {/* Real-time Status */}
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <span className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-bold text-zinc-400">
              Pending: {orders.filter(o => o.status === "PENDING").length}
            </span>
            <span className="px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-[11px] font-bold text-orange-400">
              Cooking: {orders.filter(o => o.status === "PREPARING").length}
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-bold text-emerald-400">
              Ready: {orders.filter(o => o.status === "READY").length}
            </span>
          </div>

          <div className="border-l border-zinc-800 h-6 pl-4">
            {isConnected ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                <Wifi className="w-3.5 h-3.5 animate-pulse" />
                Live Connection
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
                <WifiOff className="w-3.5 h-3.5" />
                Offline (Mock mode)
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-1 p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 content-start">
        {orders
          .filter(order => order.status !== "SERVED" && order.status !== "PAID" && order.status !== "CANCELLED")
          .map((order) => {
            const minutesElapsed = getMinutesElapsed(order.createdAt);
            const isLate = minutesElapsed > 15 && order.status !== "READY";

            return (
              <div 
                key={order.id} 
                className={`relative rounded-2xl border flex flex-col justify-between overflow-hidden shadow-xl transition-all duration-300 ${
                  order.status === "READY" 
                    ? "border-emerald-500/20 bg-emerald-950/5 hover:border-emerald-500/30" 
                    : isLate 
                      ? "border-rose-500/30 bg-rose-950/5 animate-pulse" 
                      : "border-zinc-900 bg-zinc-900/30 hover:border-zinc-800"
                }`}
              >
                {/* Top Banner (Status indicators) */}
                <div className={`px-4 py-2 flex items-center justify-between text-xs font-bold ${
                  order.status === "READY" 
                    ? "bg-emerald-500/10 text-emerald-400 border-b border-emerald-500/10" 
                     : order.status === "PREPARING"
                      ? "bg-orange-500/10 text-orange-400 border-b border-orange-500/10"
                      : "bg-zinc-900 text-zinc-400 border-b border-zinc-900"
                }`}>
                  <span className="uppercase tracking-wider">{order.status}</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{minutesElapsed}m ago</span>
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-5 flex-1 flex flex-col gap-4">
                  {/* Order Meta info */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-extrabold tracking-tight text-white">{order.tableId}</h2>
                      <p className="text-xs text-zinc-500 font-semibold mt-0.5">{order.customerName}</p>
                    </div>
                    <span className="text-[10px] bg-zinc-900 text-zinc-500 px-2 py-0.5 rounded font-mono border border-zinc-800">
                      {order.id}
                    </span>
                  </div>

                  {/* Items List */}
                  <div className="flex-1 flex flex-col gap-3">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="border-b border-zinc-900/60 pb-2 last:border-0 last:pb-0">
                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-100 font-medium">
                            <strong className="text-orange-500 font-extrabold mr-1.5 text-base">{item.quantity}x</strong> 
                            {item.name}
                          </span>
                        </div>
                        {item.specialInstructions && (
                          <div className="mt-1 flex items-start gap-1 text-[11px] text-amber-400 font-medium bg-amber-500/5 border border-amber-500/10 px-2 py-0.5 rounded">
                            <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                            <span>Notes: {item.specialInstructions}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Total Amount */}
                  <div className="flex justify-between items-center text-xs text-zinc-500 border-t border-zinc-900 pt-3">
                    <span>Total Bill:</span>
                    <span className="font-bold text-zinc-300">{formatCurrency(order.totalAmount)}</span>
                  </div>
                </div>

                {/* Action Footer Button */}
                <div className="p-3 bg-zinc-900/40 border-t border-zinc-900/80">
                  {order.status === "PENDING" && (
                    <button 
                      onClick={() => updateStatus(order.id, "PENDING")}
                      className="w-full py-2.5 px-4 bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-500/15 transition-all duration-300"
                    >
                      <Flame className="w-3.5 h-3.5 fill-current" />
                      Start Cooking
                    </button>
                  )}
                  {order.status === "PREPARING" && (
                    <button 
                      onClick={() => updateStatus(order.id, "PREPARING")}
                      className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/15 transition-all duration-300"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Mark Ready
                    </button>
                  )}
                  {order.status === "READY" && (
                    <button 
                      onClick={() => updateStatus(order.id, "READY")}
                      className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/15 transition-all duration-300"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Serve Order
                    </button>
                  )}
                </div>
              </div>
            );
          })}

        {orders.filter(order => order.status !== "SERVED" && order.status !== "PAID" && order.status !== "CANCELLED").length === 0 && (
          <div className="col-span-full py-24 flex flex-col items-center justify-center gap-3 text-zinc-500 border border-dashed border-zinc-800 rounded-3xl">
            <CheckCircle2 className="w-12 h-12 text-zinc-700" />
            <h3 className="text-zinc-400 font-bold text-base">All caught up!</h3>
            <p className="text-xs text-zinc-600">No active orders left in the kitchen.</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-4 px-6 text-center text-xs text-zinc-600 bg-zinc-950/40">
        &copy; {new Date().getFullYear()} Order-Pro Kitchen Service. All rights reserved.
      </footer>
    </div>
  );
}
