"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { DollarSign, ShoppingBag, Users, Activity, ExternalLink, Loader2 } from "lucide-react";
import Link from "next/link";
import { getDashboardStats } from "@/app/actions/analytics";
import { getRecentOrders } from "@/app/actions/orders";
import { useRestaurantId } from "@/hooks/useRestaurantId";

// Dynamically import Recharts to reduce initial bundle size
const LineChart = dynamic(() => import("recharts").then((mod) => mod.LineChart), { ssr: false, loading: () => <div className="h-full w-full flex items-center justify-center"><Loader2 className="animate-spin text-on-surface-variant" /></div> });
const Line = dynamic(() => import("recharts").then((mod) => mod.Line), { ssr: false });
const BarChart = dynamic(() => import("recharts").then((mod) => mod.BarChart), { ssr: false, loading: () => <div className="h-full w-full flex items-center justify-center"><Loader2 className="animate-spin text-on-surface-variant" /></div> });
const Bar = dynamic(() => import("recharts").then((mod) => mod.Bar), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((mod) => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((mod) => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then((mod) => mod.CartesianGrid), { ssr: false });
const RechartsTooltip = dynamic(() => import("recharts").then((mod) => mod.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then((mod) => mod.ResponsiveContainer), { ssr: false });
const Legend = dynamic(() => import("recharts").then((mod) => mod.Legend), { ssr: false });

function KpiCard({ title, value, icon: Icon, trend }: { title: string, value: string | number, icon: any, trend?: string }) {
  return (
    <div className="relative overflow-hidden bg-surface-container-lowest/80 backdrop-blur-xl p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-outline-variant/30 flex flex-col gap-2 group hover:border-primary/30 transition-all duration-300">
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors duration-500" />
      <div className="flex justify-between items-center text-on-surface-variant z-10">
        <span className="text-label-lg font-bold tracking-wide uppercase">{title}</span>
        <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
          <Icon size={22} className="drop-shadow-sm" />
        </div>
      </div>
      <div className="flex items-end gap-3 mt-3 z-10">
        <span className="text-[2.5rem] leading-none font-black text-on-surface tracking-tight">{value}</span>
        {trend && (
          <span className={`text-label-md font-bold mb-1.5 px-2 py-0.5 rounded-md ${trend.startsWith("+") ? "bg-green-500/10 text-green-500" : "bg-error/10 text-error"}`}>
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}

export default function DashboardOverviewPage() {
  const { restaurantId, loading: resLoading } = useRestaurantId();
  const [stats, setStats] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (resLoading || !restaurantId) return;

    async function loadData() {
      try {
        const [resStats, resOrders] = await Promise.all([
          getDashboardStats(restaurantId!),
          getRecentOrders(restaurantId!),
        ]);
        setStats(resStats);
        setRecentOrders(resOrders);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [restaurantId, resLoading]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Fallback if data is null
  const displayStats = stats || {
    todaysRevenue: 0,
    todaysOrdersCount: 0,
    activeOrdersCount: 0,
    hourlyData: [],
    topItems: []
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <KpiCard title="Total Revenue (Today)" value={`$${displayStats.todaysRevenue.toFixed(2)}`} icon={DollarSign} />
        <KpiCard title="Orders Today" value={displayStats.todaysOrdersCount} icon={ShoppingBag} />
        <KpiCard title="Active Orders" value={displayStats.activeOrdersCount} icon={Activity} />
        <KpiCard title="Avg Order Value" value={`$${(displayStats.todaysOrdersCount > 0 ? displayStats.todaysRevenue / displayStats.todaysOrdersCount : 0).toFixed(2)}`} icon={Users} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart (Spans 2 columns on lg) */}
        <div className="lg:col-span-2 relative overflow-hidden bg-surface-container-lowest/80 backdrop-blur-xl p-6 lg:p-8 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-outline-variant/30">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50" />
          <h3 className="text-title-xl font-black text-on-surface mb-8 relative z-10">Revenue & Orders (Today)</h3>
          <div className="h-[300px] w-full relative z-10 text-gray-600 dark:text-gray-300">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={displayStats.hourlyData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150,150,150,0.2)" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: 'currentColor' }} dy={10} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: 'currentColor' }} dx={-10} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: 'currentColor' }} dx={10} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '16px', border: '1px solid var(--theme-outline-variant)', backgroundColor: 'var(--theme-surface)', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', color: 'var(--theme-on-surface)' }}
                  labelStyle={{ fontWeight: 'bold', color: 'var(--theme-on-surface)' }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px', color: 'currentColor' }} />
                <Line yAxisId="left" type="monotone" name="Revenue ($)" dataKey="revenue" stroke="var(--theme-primary)" strokeWidth={4} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 8, strokeWidth: 0 }} />
                <Line yAxisId="right" type="monotone" name="Orders" dataKey="orders" stroke="#10b981" strokeWidth={4} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 8, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Items Bar Chart */}
        <div className="relative overflow-hidden bg-surface-container-lowest/80 backdrop-blur-xl p-6 lg:p-8 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-outline-variant/30">
          <div className="absolute inset-0 bg-gradient-to-br from-transparent to-primary/5 opacity-50" />
          <h3 className="text-title-xl font-black text-on-surface mb-8 relative z-10">Top Selling Items</h3>
          <div className="h-[300px] w-full text-gray-600 dark:text-gray-300">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={displayStats.topItems} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(150,150,150,0.2)" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} tick={{ fill: 'currentColor', fontSize: 12 }} />
                <RechartsTooltip 
                  cursor={{ fill: 'rgba(150,150,150,0.1)' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', color: 'var(--theme-on-surface)' }}
                  itemStyle={{ color: 'var(--theme-on-surface)' }}
                />
                <Bar dataKey="value" name="Units Sold" fill="var(--theme-primary)" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
        <div className="p-6 border-b border-outline-variant/30 flex justify-between items-center">
          <h3 className="text-title-lg font-bold text-on-surface">Recent Orders</h3>
          <Link href="/dashboard/orders" className="text-primary text-label-lg font-semibold flex items-center gap-1 hover:underline">
            View All <ExternalLink size={16} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant text-label-md">
                <th className="p-4 font-medium">Order ID</th>
                <th className="p-4 font-medium">Table</th>
                <th className="p-4 font-medium">Items</th>
                <th className="p-4 font-medium">Total</th>
                <th className="p-4 font-medium">Time</th>
                <th className="p-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-on-surface-variant">No recent orders found.</td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-outline-variant/20 hover:bg-surface-container-lowest transition-colors">
                    <td className="p-4 text-body-md font-medium text-on-surface">#{order.id.slice(-6)}</td>
                    <td className="p-4 text-body-md text-on-surface-variant">{order.table?.number ? `T-${order.table.number}` : "Takeaway"}</td>
                    <td className="p-4 text-body-md text-on-surface-variant">{order.items?.length || 0} items</td>
                    <td className="p-4 text-body-md font-semibold text-on-surface">${order.totalAmount.toFixed(2)}</td>
                    <td className="p-4 text-body-md text-on-surface-variant">
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold
                        ${order.status === 'PENDING' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' : ''}
                        ${order.status === 'PREPARING' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : ''}
                        ${order.status === 'READY' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : ''}
                        ${order.status === 'PAID' || order.status === 'COMPLETED' ? 'bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-300' : ''}
                        ${order.status === 'CANCELLED' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : ''}
                      `}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
