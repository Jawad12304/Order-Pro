"use client";

import React, { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSocket } from "@/context/SocketContext";
import { useRestaurantId } from "@/hooks/useRestaurantId";
import { getActiveOrders, updateOrderStatus } from "@/app/actions/orders";
import { Clock, CheckCircle2, ChefHat, X, RefreshCw, Loader2 } from "lucide-react";

type OrderStatus = "PENDING" | "CONFIRMED" | "PREPARING" | "READY" | "SERVED" | "PAID" | "CANCELLED";

export default function LiveOrdersPage() {
  const { socket, isConnected } = useSocket();
  const { restaurantId, loading: resLoading } = useRestaurantId();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"ALL" | OrderStatus>("ALL");
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // Fetch active orders from the real database
  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ["live-orders", restaurantId],
    queryFn: () => getActiveOrders(restaurantId!),
    enabled: !!restaurantId,
    refetchInterval: 30000, // Poll every 30s as a fallback when sockets are flaky
    staleTime: 10000,
  });

  // Socket listener for real-time updates
  useEffect(() => {
    if (!socket || !isConnected || !restaurantId) return;
    
    socket.emit("join_restaurant_admin", restaurantId);

    const handleNewOrder = () => {
      // Refetch from DB to get the full hydrated order
      refetch();
    };

    const handleStatusUpdate = () => {
      refetch();
    };

    socket.on("new_order", handleNewOrder);
    socket.on("order_status_update", handleStatusUpdate);

    return () => {
      socket.off("new_order", handleNewOrder);
      socket.off("order_status_update", handleStatusUpdate);
    };
  }, [socket, isConnected, restaurantId, refetch]);

  // Real status update mutation hitting the database
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string, status: OrderStatus }) => {
      return updateOrderStatus(orderId, status);
    },
    onSuccess: (updatedOrder) => {
      // Update the selected order panel if it's the same order
      if (selectedOrder?.id === updatedOrder.id) {
        setSelectedOrder(updatedOrder);
      }
      // Refetch the orders list
      queryClient.invalidateQueries({ queryKey: ["live-orders"] });
      // Notify other clients via socket
      socket?.emit("order_status_update", { orderId: updatedOrder.id, status: updatedOrder.status });
    }
  });

  const filteredOrders = activeTab === "ALL" 
    ? orders 
    : orders.filter((o: any) => o.status === activeTab);

  const getStatusColor = (status: string) => {
    switch(status) {
      case "PENDING": return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
      case "CONFIRMED": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "PREPARING": return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
      case "READY": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "SERVED": return "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300";
      case "PAID": return "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-300";
      case "CANCELLED": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-300";
    }
  };

  if (resLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-300 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h2 className="text-headline-md font-bold text-on-surface flex items-center gap-3">
            Live Orders 
            <span className="flex items-center gap-1.5 text-label-md bg-surface border border-outline-variant/50 px-2.5 py-1 rounded-full text-on-surface-variant">
              <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-error"}`}></span>
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </h2>
        </div>
        <button onClick={() => refetch()} className="p-2 bg-surface text-on-surface-variant rounded-lg border border-outline-variant/50 hover:bg-surface-variant transition-colors">
          <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 shrink-0 custom-scrollbar max-w-full">
        {(["ALL", "PENDING", "CONFIRMED", "PREPARING", "READY", "SERVED", "PAID"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 rounded-xl font-label-md whitespace-nowrap transition-colors ${
              activeTab === tab 
                ? "bg-primary text-on-primary shadow-sm" 
                : "bg-surface text-on-surface hover:bg-surface-variant border border-outline-variant/30"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex gap-6 min-h-0">
        
        {/* Table / List */}
        <div className={`bg-surface rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden flex flex-col min-w-0 transition-all duration-300 ${selectedOrder ? "w-full lg:w-2/3 hidden lg:flex" : "w-full"}`}>
          <div className="overflow-auto custom-scrollbar flex-1">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-surface-container-low text-on-surface-variant text-label-md z-10 shadow-sm">
                <tr>
                  <th className="p-4 font-medium">Order ID</th>
                  <th className="p-4 font-medium">Customer</th>
                  <th className="p-4 font-medium">Table</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Items</th>
                  <th className="p-4 font-medium">Total</th>
                  <th className="p-4 font-medium">Time Elapsed</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={7} className="text-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" /></td></tr>
                ) : filteredOrders.length === 0 ? (
                  <tr><td colSpan={7} className="text-center p-8 text-on-surface-variant">No orders found.</td></tr>
                ) : (
                  filteredOrders.map((order: any) => {
                    const minutesElapsed = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
                    return (
                      <tr 
                        key={order.id} 
                        onClick={() => setSelectedOrder(order)}
                        className={`border-b border-outline-variant/20 cursor-pointer transition-colors ${selectedOrder?.id === order.id ? "bg-primary/5" : "hover:bg-surface-container-lowest"}`}
                      >
                        <td className="p-4 text-body-md font-medium text-on-surface">#{order.id.slice(-6)}</td>
                        <td className="p-4 text-body-md text-on-surface-variant">{order.customerName || "—"}</td>
                        <td className="p-4 text-body-md font-bold text-on-surface">{order.table ? `T-${order.table.number}` : "Takeaway"}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="p-4 text-body-md text-on-surface-variant">{order.items?.length || 0} items</td>
                        <td className="p-4 text-body-md font-semibold text-on-surface">${order.totalAmount.toFixed(2)}</td>
                        <td className="p-4 text-body-md">
                          <span className={`font-semibold ${minutesElapsed > 15 && !["PAID", "SERVED", "CANCELLED"].includes(order.status) ? 'text-error' : 'text-on-surface-variant'}`}>
                            {minutesElapsed} min
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Slide-out Order Details Panel */}
        {selectedOrder && (
          <div className="fixed inset-0 z-40 lg:relative lg:inset-auto lg:z-auto w-full lg:w-1/3 bg-surface lg:rounded-2xl shadow-lg border-none lg:border lg:border-outline-variant/30 flex flex-col overflow-hidden animate-in slide-in-from-right-8 duration-300">
            <div className="p-4 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-lowest">
              <div>
                <h3 className="text-title-lg font-bold text-on-surface">Order #{selectedOrder.id.slice(-6)}</h3>
                <p className="text-body-sm text-on-surface-variant">
                  {selectedOrder.table ? `Table ${selectedOrder.table.number}` : "Takeaway"}
                  {selectedOrder.customerName && ` • ${selectedOrder.customerName}`}
                </p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-2 text-on-surface-variant hover:bg-surface-variant rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto">
              <div className="mb-6">
                <h4 className="text-label-md font-semibold text-on-surface-variant uppercase tracking-wider mb-3">Status Override</h4>
                <div className="grid grid-cols-2 gap-2">
                  {(["PENDING", "CONFIRMED", "PREPARING", "READY", "SERVED", "PAID", "CANCELLED"] as const).map(s => (
                    <button 
                      key={s}
                      onClick={() => updateStatusMutation.mutate({ orderId: selectedOrder.id, status: s })}
                      disabled={selectedOrder.status === s || updateStatusMutation.isPending}
                      className={`py-2 px-3 rounded-lg text-label-sm font-bold border transition-colors ${
                        selectedOrder.status === s 
                          ? getStatusColor(s) + " border-transparent opacity-100" 
                          : "bg-surface border-outline-variant/50 text-on-surface hover:bg-surface-variant disabled:opacity-50"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {selectedOrder.notes && (
                <div className="mb-6">
                  <h4 className="text-label-md font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Notes</h4>
                  <p className="text-body-sm text-on-surface bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/20 italic">{selectedOrder.notes}</p>
                </div>
              )}

              <div>
                <h4 className="text-label-md font-semibold text-on-surface-variant uppercase tracking-wider mb-3">Items</h4>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-start pb-3 border-b border-outline-variant/20 last:border-0">
                      <div className="flex gap-3">
                        <span className="font-bold text-primary">{item.quantity}x</span>
                        <div>
                          <p className="text-body-md font-medium text-on-surface">{item.menuItem?.name || "Unknown Item"}</p>
                          {item.specialInstructions && (
                            <p className="text-body-sm text-on-surface-variant italic mt-0.5">"{item.specialInstructions}"</p>
                          )}
                          {item.modifiersJson && Array.isArray(item.modifiersJson) && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {item.modifiersJson.map((mod: any, i: number) => (
                                <span key={i} className="text-xs bg-surface-variant px-1.5 py-0.5 rounded text-on-surface-variant">
                                  {mod.modifier}{mod.priceDelta > 0 ? ` +$${mod.priceDelta.toFixed(2)}` : ""}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="text-body-sm font-semibold text-on-surface">${(item.unitPrice * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-surface-container-lowest border-t border-outline-variant/30 flex justify-between items-center">
              <span className="text-title-md font-bold text-on-surface">Total</span>
              <span className="text-title-lg font-black text-primary">${selectedOrder.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
