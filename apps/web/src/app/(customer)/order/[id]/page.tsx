"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BellRing, RotateCcw, Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import confetti from "canvas-confetti";
import { OrderTimeline, OrderStatus } from "@/components/customer/OrderTimeline";
import { useSocket } from "@/context/SocketContext";
import { useCart } from "@/context/CartContext";
import { requestNotificationPermission, sendLocalNotification } from "@/utils/notifications";

export default function OrderTrackingPage() {
  const params = useParams();
  const orderId = params.id as string;
  const router = useRouter();
  const { socket, isConnected } = useSocket();
  const { dispatch: cartDispatch } = useCart();

  const [status, setStatus] = useState<OrderStatus>("PENDING");
  const [notificationGranted, setNotificationGranted] = useState(false);

  // Fetch initial order
  const { data: orderData, isLoading, error } = useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${orderId}`);
      if (!res.ok) throw new Error("Failed to fetch order");
      return res.json();
    },
  });

  // Call Waiter Mutation
  const callWaiterMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/waiter-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          tableId: orderData?.order?.tableId || "unknown", 
          restaurantId: orderData?.order?.restaurantId || "unknown" 
        }),
      });
      if (!res.ok) throw new Error("Failed to call waiter");
      return res.json();
    },
    onSuccess: () => {
      // Optimistically emit socket event if connected
      if (socket && isConnected) {
        socket.emit("call_waiter", { tableId: orderData?.order?.tableId });
      }
      alert("Waiter has been notified and is on their way!");
    }
  });

  // Setup Notification Permission
  useEffect(() => {
    requestNotificationPermission().then(granted => setNotificationGranted(granted));
  }, []);

  // Set initial status once data loads
  useEffect(() => {
    if (orderData?.order?.status) {
      setStatus(orderData.order.status as OrderStatus);
    }
  }, [orderData]);

  // WebSocket Subscription
  useEffect(() => {
    if (!socket || !isConnected || !orderId) return;

    socket.emit("join_order", orderId);

    const handleUpdate = (data: { status: OrderStatus }) => {
      setStatus(data.status);
      
      // Trigger Celebratory UI + Push on READY
      if (data.status === "READY") {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#F97316", "#ffffff"] // Brand colors
        });
        
        if (notificationGranted) {
          sendLocalNotification("Order Ready! 🎉", {
            body: "Your food is ready! Please collect it or wait for it to be served.",
          });
        }
      }
    };

    socket.on("order_status_update", handleUpdate);

    return () => {
      socket.off("order_status_update", handleUpdate);
      socket.emit("leave_order", orderId);
    };
  }, [socket, isConnected, orderId, notificationGranted]);

  const handleReorder = () => {
    if (!orderData?.order?.items) return;

    // Clear existing cart and populate with previous items
    cartDispatch({ type: "CLEAR_CART" });
    
    orderData.order.items.forEach((orderItem: any) => {
      cartDispatch({
        type: "ADD_ITEM",
        payload: {
          id: `${orderItem.menuItemId}-${Date.now()}-${Math.random()}`,
          menuItemId: orderItem.menuItemId,
          name: orderItem.menuItem?.name || "Item",
          basePrice: orderItem.unitPrice,
          quantity: orderItem.quantity,
          modifiers: orderItem.modifiersJson || [],
          specialInstructions: orderItem.specialInstructions,
        }
      });
    });

    router.push("/menu");
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 size={32} className="animate-spin text-primary" /></div>;
  }

  if (error || !orderData?.order) {
    return <div className="text-center pt-20 text-on-surface">Order not found.</div>;
  }

  return (
    <div className="px-margin-mobile pt-8 pb-32">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/menu" className="p-2 bg-surface-container-high rounded-full">
          <ArrowLeft size={20} className="text-on-surface" />
        </Link>
        <div>
          <h1 className="text-headline-xl font-headline-xl text-on-surface">Order #{orderId.slice(-5).toUpperCase()}</h1>
          <p className="text-body-sm text-on-surface-variant flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-error"}`}></span>
            {isConnected ? "Live Updates" : "Connecting..."}
          </p>
        </div>
      </div>

      <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-outline-variant/20 mb-6">
        <OrderTimeline status={status} />
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => callWaiterMutation.mutate()}
          disabled={callWaiterMutation.isPending}
          className="flex flex-col items-center justify-center gap-2 bg-surface-container-high text-on-surface py-4 rounded-2xl shadow-sm active:scale-95 transition-transform disabled:opacity-70"
        >
          <BellRing size={24} className="text-primary" />
          <span className="text-label-caps font-label-caps font-bold">Call Waiter</span>
        </button>

        <button 
          onClick={handleReorder}
          className="flex flex-col items-center justify-center gap-2 bg-primary/10 text-primary py-4 rounded-2xl shadow-sm active:scale-95 transition-transform"
        >
          <RotateCcw size={24} />
          <span className="text-label-caps font-label-caps font-bold">Re-order</span>
        </button>
      </div>
    </div>
  );
}
