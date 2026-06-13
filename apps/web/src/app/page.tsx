"use client";

import { ChefHat } from "lucide-react";
import { LoginForm } from "@/components/auth/LoginForm";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4 relative overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-500/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-500/8 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-600/5 rounded-full blur-[150px]" />
      </div>

      <div className="w-full max-w-[420px] relative z-10">
        {/* Logo / Brand Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/25 mb-5">
            <ChefHat className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Order<span className="text-orange-500">Pro</span>
          </h1>
          <p className="mt-2 text-sm text-zinc-400 font-medium">
            Sign in to your management portal
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/80 shadow-2xl shadow-black/40 p-6 sm:p-8">
          <LoginForm />
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-zinc-600 mt-6">
          &copy; {new Date().getFullYear()} Order-Pro. All rights reserved.
        </p>
      </div>
    </div>
  );
}
