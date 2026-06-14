"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ConciergeBell, LogOut, Clock, Loader2 } from "lucide-react";
import { apiLogout } from "@/lib/api";
import { getActiveOrders } from "@/app/actions/orders";
import { useRestaurantId } from "@/hooks/useRestaurantId";

export default function WaiterPage() {
  const router = useRouter();
  const { restaurantId, loading: resLoading } = useRestaurantId();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (resLoading || !restaurantId) return;

    async function load() {
      try {
        const data = await getActiveOrders(restaurantId!);
        setOrders(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [restaurantId, resLoading]);

  const handleLogout = async () => {
    try { await apiLogout(); } catch {}
    localStorage.removeItem("order-pro-auth");
    router.push("/");
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-orange-500/10 text-orange-400 border-orange-500/30";
      case "CONFIRMED": return "bg-blue-500/10 text-blue-400 border-blue-500/30";
      case "PREPARING": return "bg-purple-500/10 text-purple-400 border-purple-500/30";
      case "READY": return "bg-green-500/10 text-green-400 border-green-500/30";
      default: return "bg-zinc-800 text-zinc-400 border-zinc-700";
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-500 p-2 rounded-xl">
            <ConciergeBell className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold">Waiter Panel</h1>
            <p className="text-zinc-400 text-sm">Order Pro</p>
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors text-sm font-medium text-zinc-300">
          <LogOut size={16} />
          Sign Out
        </button>
      </header>

      {/* Content */}
      <main className="p-6">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
            <ConciergeBell size={48} className="mb-4 opacity-50" />
            <p className="text-lg font-medium">No active orders</p>
            <p className="text-sm">Orders will appear here when customers place them</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-lg font-bold">#{order.id.slice(-6)}</p>
                    {order.table && (
                      <p className="text-xs text-zinc-500 font-medium">Table {order.table.number}</p>
                    )}
                  </div>
                  <div className="text-sm text-zinc-400">
                    {order.items?.length || 0} items · ${order.totalAmount?.toFixed(2)}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${statusColor(order.status)}`}>
                    {order.status}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-zinc-500">
                    <Clock size={12} />
                    {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
