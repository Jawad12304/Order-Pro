"use client";

import React, { useMemo } from "react";
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend 
} from "recharts";
import { DollarSign, ShoppingBag, Users, Activity, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

// --- Mock Data Generators (until real API is attached) ---
const mockHourlyData = Array.from({ length: 12 }).map((_, i) => ({
  time: `${i + 10}:00`,
  orders: Math.floor(Math.random() * 50) + 10,
  revenue: Math.floor(Math.random() * 500) + 100,
}));

const mockTopItems = [
  { name: "Classic Cheeseburger", sales: 124 },
  { name: "Truffle Fries", sales: 98 },
  { name: "Spicy Chicken Sandwich", sales: 85 },
  { name: "Margherita Pizza", sales: 64 },
  { name: "Craft Cola", sales: 42 },
];

const mockRecentOrders = [
  { id: "ord_101", table: "T-4", items: 3, total: 45.50, status: "PENDING", time: "2 min ago" },
  { id: "ord_102", table: "T-12", items: 1, total: 12.00, status: "PREPARING", time: "5 min ago" },
  { id: "ord_103", table: "T-2", items: 4, total: 89.90, status: "READY", time: "12 min ago" },
  { id: "ord_104", table: "T-8", items: 2, total: 34.00, status: "COMPLETED", time: "25 min ago" },
  { id: "ord_105", table: "T-1", items: 5, total: 112.50, status: "COMPLETED", time: "45 min ago" },
];

function KpiCard({ title, value, icon: Icon, trend }: { title: string, value: string | number, icon: any, trend?: string }) {
  return (
    <div className="bg-surface p-6 rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col gap-2">
      <div className="flex justify-between items-center text-on-surface-variant">
        <span className="text-label-lg font-medium">{title}</span>
        <Icon size={20} className="text-primary" />
      </div>
      <div className="flex items-end gap-3 mt-2">
        <span className="text-headline-lg font-bold text-on-surface">{value}</span>
        {trend && (
          <span className={`text-label-md font-semibold mb-1 ${trend.startsWith("+") ? "text-green-600" : "text-error"}`}>
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}

export default function DashboardOverviewPage() {
  
  // In a real app, we would fetch these from an API
  // const { data, isLoading } = useQuery({ queryKey: ['dashboard-stats'], queryFn: ... });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <KpiCard title="Total Revenue" value="$2,450.00" icon={DollarSign} trend="+12.5%" />
        <KpiCard title="Orders Today" value={142} icon={ShoppingBag} trend="+5.2%" />
        <KpiCard title="Avg Order Value" value="$17.25" icon={Activity} trend="-1.1%" />
        <KpiCard title="Active Tables" value={8} icon={Users} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart (Spans 2 columns on lg) */}
        <div className="lg:col-span-2 bg-surface p-6 rounded-2xl shadow-sm border border-outline-variant/30">
          <h3 className="text-title-lg font-bold text-on-surface mb-6">Revenue & Orders (Today)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockHourlyData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150,150,150,0.2)" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: 'var(--theme-on-surface-variant)' }} dy={10} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: 'var(--theme-on-surface-variant)' }} dx={-10} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: 'var(--theme-on-surface-variant)' }} dx={10} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: 'var(--theme-on-surface)' }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Line yAxisId="left" type="monotone" name="Revenue ($)" dataKey="revenue" stroke="var(--theme-primary)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line yAxisId="right" type="monotone" name="Orders" dataKey="orders" stroke="var(--theme-secondary, #10b981)" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Items Bar Chart */}
        <div className="bg-surface p-6 rounded-2xl shadow-sm border border-outline-variant/30">
          <h3 className="text-title-lg font-bold text-on-surface mb-6">Top Selling Items</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockTopItems} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(150,150,150,0.2)" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} tick={{ fill: 'var(--theme-on-surface-variant)', fontSize: 12 }} />
                <RechartsTooltip 
                  cursor={{ fill: 'rgba(150,150,150,0.1)' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="sales" name="Units Sold" fill="var(--theme-primary)" radius={[0, 4, 4, 0]} barSize={20} />
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
              {mockRecentOrders.map((order, i) => (
                <tr key={order.id} className="border-b border-outline-variant/20 hover:bg-surface-container-lowest transition-colors">
                  <td className="p-4 text-body-md font-medium text-on-surface">#{order.id.split("_")[1]}</td>
                  <td className="p-4 text-body-md text-on-surface-variant">{order.table}</td>
                  <td className="p-4 text-body-md text-on-surface-variant">{order.items} items</td>
                  <td className="p-4 text-body-md font-semibold text-on-surface">${order.total.toFixed(2)}</td>
                  <td className="p-4 text-body-md text-on-surface-variant">{order.time}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold
                      ${order.status === 'PENDING' ? 'bg-orange-100 text-orange-800' : ''}
                      ${order.status === 'PREPARING' ? 'bg-blue-100 text-blue-800' : ''}
                      ${order.status === 'READY' ? 'bg-green-100 text-green-800' : ''}
                      ${order.status === 'COMPLETED' ? 'bg-gray-100 text-gray-800' : ''}
                    `}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
