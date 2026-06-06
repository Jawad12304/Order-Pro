"use client";

import React from "react";
import { Users, Store, DollarSign, Activity } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

// Mock Data
const signupData = [
  { name: "Mon", signups: 4 },
  { name: "Tue", signups: 7 },
  { name: "Wed", signups: 5 },
  { name: "Thu", signups: 12 },
  { name: "Fri", signups: 18 },
  { name: "Sat", signups: 24 },
  { name: "Sun", signups: 15 },
];

const planData = [
  { name: "Free", value: 400 },
  { name: "Starter", value: 300 },
  { name: "Pro", value: 300 },
  { name: "Enterprise", value: 100 },
];

const COLORS = ["#94a3b8", "#3b82f6", "#8b5cf6", "#f59e0b"];

export default function SuperAdminOverview() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-headline-sm font-bold text-on-surface">Platform Overview</h1>
        <p className="text-body-md text-on-surface-variant mt-1">Real-time metrics across all Order Pro tenants.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-surface p-6 rounded-2xl border border-outline-variant/30 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Store size={24} />
          </div>
          <div>
            <p className="text-label-sm font-bold text-on-surface-variant uppercase tracking-wider">Total Restaurants</p>
            <h3 className="text-headline-md font-black text-on-surface mt-1">1,204</h3>
          </div>
        </div>
        
        <div className="bg-surface p-6 rounded-2xl border border-outline-variant/30 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center shrink-0">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-label-sm font-bold text-on-surface-variant uppercase tracking-wider">Active Today</p>
            <h3 className="text-headline-md font-black text-on-surface mt-1">843</h3>
          </div>
        </div>

        <div className="bg-surface p-6 rounded-2xl border border-outline-variant/30 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-label-sm font-bold text-on-surface-variant uppercase tracking-wider">MRR</p>
            <h3 className="text-headline-md font-black text-on-surface mt-1">$42.5k</h3>
          </div>
        </div>

        <div className="bg-surface p-6 rounded-2xl border border-outline-variant/30 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
            <Users size={24} />
          </div>
          <div>
            <p className="text-label-sm font-bold text-on-surface-variant uppercase tracking-wider">Total GMV</p>
            <h3 className="text-headline-md font-black text-on-surface mt-1">$2.1M</h3>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Line Chart: Signups */}
        <div className="bg-surface p-6 rounded-2xl border border-outline-variant/30 shadow-sm">
          <h3 className="text-title-md font-bold text-on-surface mb-6">New Signups (This Week)</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={signupData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.1)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dx={-10} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ stroke: 'rgba(0,0,0,0.05)', strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="signups" 
                  stroke="var(--color-primary, #000)" 
                  strokeWidth={4}
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Plans */}
        <div className="bg-surface p-6 rounded-2xl border border-outline-variant/30 shadow-sm">
          <h3 className="text-title-md font-bold text-on-surface mb-6">Subscription Breakdown</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={planData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {planData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
