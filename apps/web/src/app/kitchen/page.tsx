"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChefHat, LogOut, Clock, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { apiLogout } from "@/lib/api";
import { getActiveOrders } from "@/app/actions/orders";
import { useRestaurantId } from "@/hooks/useRestaurantId";

export default function KitchenPage() {
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
    // Refresh every 15 seconds
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [restaurantId, resLoading]);

  const handleLogout = async () => {
    try { await apiLogout(); } catch {}
    localStorage.removeItem("order-pro-auth");
    router.push("/");
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "PENDING": return <AlertCircle className="text-orange-500" size={18} />;
      case "CONFIRMED": return <Clock className="text-blue-500" size={18} />;
      case "PREPARING": return <ChefHat className="text-purple-500" size={18} />;
      case "READY": return <CheckCircle className="text-green-500" size={18} />;
      default: return <Clock className="text-gray-400" size={18} />;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-orange-500 p-2 rounded-xl">
            <ChefHat className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold">Kitchen Display</h1>
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
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
            <ChefHat size={48} className="mb-4 opacity-50" />
            <p className="text-lg font-medium">No active orders</p>
            <p className="text-sm">New orders will appear here automatically</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold">#{order.id.slice(-6)}</span>
                  <div className="flex items-center gap-2">
                    {statusIcon(order.status)}
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-zinc-800">{order.status}</span>
                  </div>
                </div>
                {order.table && (
                  <p className="text-sm text-zinc-400">Table {order.table.number}</p>
                )}
                <div className="space-y-2 border-t border-zinc-800 pt-3">
                  {order.items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-zinc-300">{item.quantity}x {item.menuItem?.name || "Item"}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-zinc-500">
                  {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
