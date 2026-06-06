"use client";

import React, { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useSocket } from "@/context/SocketContext";
import { Clock, CheckCircle2, ChefHat, X, RefreshCw } from "lucide-react";
import { OrderStatus } from "@/components/customer/OrderTimeline";

export default function LiveOrdersPage() {
  const { socket, isConnected } = useSocket();
  const [activeTab, setActiveTab] = useState<"ALL" | OrderStatus>("ALL");
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // In a real app we'd fetch this from the backend
  const { data: initialOrders, isLoading, refetch } = useQuery({
    queryKey: ["live-orders"],
    queryFn: async () => {
      // Mocking for now, but would hit /api/orders?active=true
      return [
        { id: "ord_101", tableId: "T-4", status: "PENDING", items: [{ name: "Burger", qty: 2 }], total: 45.50, createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString() },
        { id: "ord_102", tableId: "T-12", status: "PREPARING", items: [{ name: "Pizza", qty: 1 }], total: 12.00, createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString() },
        { id: "ord_103", tableId: "T-2", status: "READY", items: [{ name: "Pasta", qty: 4 }], total: 89.90, createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString() },
      ];
    }
  });

  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    if (initialOrders) setOrders(initialOrders);
  }, [initialOrders]);

  // Socket listener for real-time updates
  useEffect(() => {
    if (!socket || !isConnected) return;
    
    // Admin needs to listen to all order updates for this restaurant
    socket.emit("join_restaurant_admin", "restaurant_123");

    const handleNewOrder = (order: any) => {
      setOrders(prev => [order, ...prev]);
    };

    const handleStatusUpdate = (data: { orderId: string, status: OrderStatus }) => {
      setOrders(prev => prev.map(o => o.id === data.orderId ? { ...o, status: data.status } : o));
      if (selectedOrder?.id === data.orderId) {
        setSelectedOrder((prev: any) => ({ ...prev, status: data.status }));
      }
    };

    socket.on("new_order", handleNewOrder);
    socket.on("order_status_update", handleStatusUpdate);

    return () => {
      socket.off("new_order", handleNewOrder);
      socket.off("order_status_update", handleStatusUpdate);
    };
  }, [socket, isConnected, selectedOrder]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string, status: OrderStatus }) => {
      // return fetch(`/api/orders/${orderId}/status`, { method: "PUT", body: JSON.stringify({ status }) })
      return new Promise(resolve => setTimeout(() => resolve({ orderId, status }), 500));
    },
    onSuccess: (data: any) => {
      // Optimistically update UI and emit socket
      setOrders(prev => prev.map(o => o.id === data.orderId ? { ...o, status: data.status } : o));
      if (selectedOrder?.id === data.orderId) {
        setSelectedOrder((prev: any) => ({ ...prev, status: data.status }));
      }
      socket?.emit("order_status_update", data);
    }
  });

  const filteredOrders = activeTab === "ALL" 
    ? orders 
    : orders.filter(o => o.status === activeTab);

  const getStatusColor = (status: string) => {
    switch(status) {
      case "PENDING": return "bg-orange-100 text-orange-800";
      case "CONFIRMED": return "bg-blue-100 text-blue-800";
      case "PREPARING": return "bg-purple-100 text-purple-800";
      case "READY": return "bg-green-100 text-green-800";
      case "SERVED":
      case "COMPLETED": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

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
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 shrink-0 custom-scrollbar">
        {["ALL", "PENDING", "PREPARING", "READY", "COMPLETED"].map((tab) => (
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
        <div className={`bg-surface rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden flex flex-col transition-all duration-300 ${selectedOrder ? "w-2/3 hidden lg:flex" : "w-full"}`}>
          <div className="overflow-y-auto custom-scrollbar flex-1">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-surface-container-low text-on-surface-variant text-label-md z-10 shadow-sm">
                <tr>
                  <th className="p-4 font-medium">Order ID</th>
                  <th className="p-4 font-medium">Table</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Items</th>
                  <th className="p-4 font-medium">Total</th>
                  <th className="p-4 font-medium">Time Elapsed</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr><td colSpan={6} className="text-center p-8 text-on-surface-variant">No orders found.</td></tr>
                ) : (
                  filteredOrders.map((order) => {
                    const minutesElapsed = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
                    return (
                      <tr 
                        key={order.id} 
                        onClick={() => setSelectedOrder(order)}
                        className={`border-b border-outline-variant/20 cursor-pointer transition-colors ${selectedOrder?.id === order.id ? "bg-primary/5" : "hover:bg-surface-container-lowest"}`}
                      >
                        <td className="p-4 text-body-md font-medium text-on-surface">#{order.id.split("_")[1]}</td>
                        <td className="p-4 text-body-md font-bold text-on-surface">{order.tableId}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="p-4 text-body-md text-on-surface-variant">{order.items.reduce((acc: number, i: any) => acc + i.qty, 0)} items</td>
                        <td className="p-4 text-body-md font-semibold text-on-surface">${order.total.toFixed(2)}</td>
                        <td className="p-4 text-body-md">
                          <span className={`font-semibold ${minutesElapsed > 15 && order.status !== 'COMPLETED' ? 'text-error' : 'text-on-surface-variant'}`}>
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
          <div className="w-full lg:w-1/3 bg-surface rounded-2xl shadow-lg border border-outline-variant/30 flex flex-col overflow-hidden animate-in slide-in-from-right-8 duration-300">
            <div className="p-4 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-lowest">
              <div>
                <h3 className="text-title-lg font-bold text-on-surface">Order #{selectedOrder.id.split("_")[1]}</h3>
                <p className="text-body-sm text-on-surface-variant">{selectedOrder.tableId}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-2 text-on-surface-variant hover:bg-surface-variant rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto">
              <div className="mb-6">
                <h4 className="text-label-md font-semibold text-on-surface-variant uppercase tracking-wider mb-3">Status Override</h4>
                <div className="grid grid-cols-2 gap-2">
                  {["PENDING", "CONFIRMED", "PREPARING", "READY", "COMPLETED", "CANCELLED"].map(s => (
                    <button 
                      key={s}
                      onClick={() => updateStatusMutation.mutate({ orderId: selectedOrder.id, status: s as OrderStatus })}
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

              <div>
                <h4 className="text-label-md font-semibold text-on-surface-variant uppercase tracking-wider mb-3">Items</h4>
                <div className="space-y-3">
                  {selectedOrder.items.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between items-start pb-3 border-b border-outline-variant/20 last:border-0">
                      <div className="flex gap-3">
                        <span className="font-bold text-primary">{item.qty}x</span>
                        <div>
                          <p className="text-body-md font-medium text-on-surface">{item.name}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-surface-container-lowest border-t border-outline-variant/30 flex justify-between items-center">
              <span className="text-title-md font-bold text-on-surface">Total</span>
              <span className="text-title-lg font-black text-primary">${selectedOrder.total.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
