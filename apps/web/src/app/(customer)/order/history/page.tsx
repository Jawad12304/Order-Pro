"use client";

import React, { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import { getMyOrders } from "@/app/actions/orders";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Receipt, ArrowRight, Clock, Coffee, Sparkles } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function OrderHistoryPage() {
  const { state, resolveTableId } = useCart();
  const [sessionOrderIds, setSessionOrderIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const existing = JSON.parse(sessionStorage.getItem("myOrderIds") || "[]");
      if (Array.isArray(existing)) setSessionOrderIds(existing);
    } catch (e) {
      // ignore
    }
  }, []);

  const searchParams = useSearchParams();
  const urlRestaurantId = searchParams.get("restaurantId");
  const activeRestaurantId = state.restaurantId || urlRestaurantId;

  const { data: orders, isLoading } = useQuery({
    queryKey: ["myOrders", activeRestaurantId, sessionOrderIds, state.tableNumber],
    queryFn: async () => {
      if (!activeRestaurantId) return [];
      const tableId = state.tableNumber ? resolveTableId(state.tableNumber) : null;
      return await getMyOrders(activeRestaurantId, sessionOrderIds, tableId);
    },
    enabled: !!activeRestaurantId,
    refetchInterval: 10000,
  });

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "PENDING": return { color: "bg-surface-variant text-on-surface-variant border-outline-variant/30", icon: Clock, label: "Pending" };
      case "CONFIRMED": return { color: "bg-primary-container text-on-primary-container border-primary/20", icon: Sparkles, label: "Confirmed" };
      case "PREPARING": return { color: "bg-secondary-container text-on-secondary-container border-secondary/20", icon: Coffee, label: "Preparing" };
      case "READY": return { color: "bg-[#dcfce7] text-[#166534] border-[#166534]/20", icon: Sparkles, label: "Ready to Serve" };
      case "SERVED": return { color: "bg-surface-container-high text-on-surface border-outline-variant/30", icon: Receipt, label: "Served" };
      case "PAID": return { color: "bg-surface-container text-on-surface-variant border-outline-variant/30", icon: Receipt, label: "Paid" };
      default: return { color: "bg-surface-variant text-on-surface-variant", icon: Clock, label: status };
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <div className="px-4 md:px-margin-mobile pt-6 pb-32 min-h-screen relative overflow-hidden">
      {/* Background ambient gradient */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none -z-10" />

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex items-center gap-4 mb-10"
      >
        <div className="p-3 bg-surface-container-highest backdrop-blur-md rounded-2xl shadow-sm border border-outline-variant/20">
          <Receipt size={28} className="text-primary" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-on-surface tracking-tight">Active Orders</h1>
          <p className="text-body-sm text-on-surface-variant mt-0.5">Track your food in real-time</p>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-32"
          >
            <Loader2 size={40} className="animate-spin text-primary/50 mb-4" />
            <p className="text-on-surface-variant font-label-md">Loading your orders...</p>
          </motion.div>
        ) : !orders || orders.length === 0 ? (
          <motion.div 
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-20 bg-surface/50 backdrop-blur-xl rounded-[2rem] border border-outline-variant/20 shadow-sm"
          >
            <div className="w-24 h-24 bg-surface-container-high rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <Receipt size={40} className="text-on-surface-variant/40" />
            </div>
            <h3 className="text-title-lg font-bold text-on-surface mb-2">No active orders</h3>
            <p className="text-body-md text-on-surface-variant max-w-[260px] mx-auto leading-relaxed">
              You haven't placed any orders yet. Try out some of our delicious menu items!
            </p>
            <Link href="/menu" className="mt-8 inline-block bg-primary text-on-primary font-label-caps text-label-caps px-8 py-4 rounded-full shadow-md active:scale-95 transition-transform">
              BROWSE MENU
            </Link>
          </motion.div>
        ) : (
          <motion.div 
            key="list"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-5"
          >
            {orders.map((order: any) => {
              const statusConfig = getStatusConfig(order.status);
              const StatusIcon = statusConfig.icon;
              
              return (
                <motion.div key={order.id} variants={itemVariants}>
                  <Link href={`/order/${order.id}`} className="block group">
                    <div className="bg-surface/60 backdrop-blur-xl p-5 rounded-[1.5rem] shadow-sm border border-outline-variant/30 group-hover:border-primary/30 group-hover:shadow-md transition-all duration-300 relative overflow-hidden">
                      {/* Interactive glow effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      
                      <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="text-label-sm text-on-surface-variant flex items-center gap-1.5 mb-1">
                              <Clock size={12} /> {format(new Date(order.createdAt), "h:mm a")}
                            </p>
                            <h3 className="font-title-md text-on-surface tracking-tight">Order #{order.id.slice(-5).toUpperCase()}</h3>
                          </div>
                          <span className={`flex items-center gap-1.5 text-label-sm font-bold px-3 py-1.5 rounded-full border shadow-sm ${statusConfig.color}`}>
                            <StatusIcon size={12} />
                            {statusConfig.label}
                          </span>
                        </div>
                        
                        <div className="mb-5 bg-surface-container-lowest/50 rounded-xl p-3 border border-outline-variant/10">
                          <p className="text-body-sm text-on-surface line-clamp-2 leading-relaxed">
                            {order.items.map(i => `<span class="font-medium">${i.quantity}x</span> ${i.menuItem?.name || "Item"}`).join(" • ").replace(/<[^>]*>?/gm, '')}
                          </p>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="font-title-lg text-on-surface">${order.totalAmount.toFixed(2)}</span>
                          <div className="flex items-center gap-1.5 text-label-sm text-primary font-bold group-hover:translate-x-1 transition-transform">
                            Live Tracking <ArrowRight size={14} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
