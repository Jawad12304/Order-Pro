"use client";

import React from "react";
import { ChefHat, Smartphone, BarChart3, Settings, AlertCircle, Wifi, WifiOff } from "lucide-react";
import { useSocket } from "@/context/SocketContext";

export default function Home() {
  const { isConnected } = useSocket();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans flex flex-col justify-between selection:bg-orange-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-none tracking-tight">Order-Pro</h1>
            <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest">SaaS Ordering Platform</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isConnected ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <Wifi className="w-3.5 h-3.5 animate-pulse" />
              Real-time Connected
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
              <WifiOff className="w-3.5 h-3.5" />
              Offline
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-12 flex flex-col justify-center gap-8">
        <div className="text-center max-w-2xl mx-auto flex flex-col gap-4">
          <span className="text-xs font-bold uppercase tracking-widest text-orange-500 bg-orange-500/10 px-3 py-1 rounded-full w-fit mx-auto">
            Interactive Portal
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-50 via-zinc-100 to-zinc-500 bg-clip-text text-transparent">
            Smart Dining, Reimagined.
          </h2>
          <p className="text-zinc-400 text-base md:text-lg leading-relaxed">
            Choose a portal below to simulate different parts of the multi-tenant SaaS ecosystem. 
            All modules communicate in real-time.
          </p>
        </div>

        {/* Portals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {/* Customer App */}
          <div className="group relative rounded-2xl border border-zinc-900 bg-zinc-900/30 p-6 hover:bg-zinc-900/50 hover:border-zinc-800 transition-all duration-300 flex flex-col justify-between h-64 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl group-hover:bg-orange-500/10 transition-all duration-300" />
            <div>
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 mb-4 group-hover:scale-110 transition-transform duration-300">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-zinc-100">Customer PWA</h3>
              <p className="text-sm text-zinc-400 mt-2">
                Simulate a customer scanning a table QR code. Browse menus, add items, place orders.
              </p>
            </div>
            <a 
              href="/menu/table-12" 
              className="mt-6 w-full text-center py-2.5 px-4 bg-zinc-900 border border-zinc-800 rounded-xl text-sm font-semibold hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all duration-300 block"
            >
              Open Mobile App
            </a>
          </div>

          {/* KDS (Kitchen Display System) */}
          <div className="group relative rounded-2xl border border-zinc-900 bg-zinc-900/30 p-6 hover:bg-zinc-900/50 hover:border-zinc-800 transition-all duration-300 flex flex-col justify-between h-64 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl group-hover:bg-amber-500/10 transition-all duration-300" />
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4 group-hover:scale-110 transition-transform duration-300">
                <ChefHat className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-zinc-100">Kitchen Display (KDS)</h3>
              <p className="text-sm text-zinc-400 mt-2">
                Real-time dashboard for the kitchen staff. Receives customer orders instantly via WebSockets.
              </p>
            </div>
            <a 
              href="/kds" 
              className="mt-6 w-full text-center py-2.5 px-4 bg-zinc-900 border border-zinc-800 rounded-xl text-sm font-semibold hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-all duration-300 block"
            >
              Launch KDS
            </a>
          </div>

          {/* Restaurant Dashboard */}
          <div className="group relative rounded-2xl border border-zinc-900 bg-zinc-900/30 p-6 hover:bg-zinc-900/50 hover:border-zinc-800 transition-all duration-300 flex flex-col justify-between h-64 overflow-hidden col-span-1 md:col-span-2 lg:col-span-1">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-all duration-300" />
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4 group-hover:scale-110 transition-transform duration-300">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-zinc-100">Merchant Dashboard</h3>
              <p className="text-sm text-zinc-400 mt-2">
                Manage menus, customize catalogs, view revenue analytics, and monitor staff/tables.
              </p>
            </div>
            <a 
              href="/dashboard" 
              className="mt-6 w-full text-center py-2.5 px-4 bg-zinc-900 border border-zinc-800 rounded-xl text-sm font-semibold hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all duration-300 block"
            >
              Open Dashboard
            </a>
          </div>
        </div>

        {/* Informative Footer Section */}
        <div className="mt-8 rounded-2xl border border-zinc-900 bg-zinc-900/10 p-5 flex items-start gap-4">
          <AlertCircle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
          <div className="text-xs text-zinc-400 leading-relaxed">
            <p className="font-semibold text-zinc-300 mb-1">Architectural Sandbox Mode</p>
            This dashboard works hand-in-hand with our Express backend services. To simulate real-time notification push and database operations, verify that the Node.js Express server is started and running.
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-6 px-6 text-center text-xs text-zinc-600">
        &copy; {new Date().getFullYear()} Order-Pro. All rights reserved.
      </footer>
    </div>
  );
}
