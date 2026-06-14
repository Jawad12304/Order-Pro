"use client";

import { useState } from "react";
import { ChefHat } from "lucide-react";
import { LoginForm } from "@/components/auth/LoginForm";
import { ForgotPassword } from "@/components/auth/ForgotPassword";
import { RoleBadgesRow } from "@/components/auth/RoleBadges";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export default function LoginPage() {
  const [showForgot, setShowForgot] = useState(false);
  const [autofill, setAutofill] = useState<{ username: string; password: string } | undefined>();

  const handleRoleSelect = (role: string) => {
    const password = "Jd123004@";
    let username = "";
    switch (role) {
      case "superadmin": username = "superadmin"; break;
      case "admin": username = "pizzapalace_admin"; break;
      case "kitchen": username = "pizzapalace_kitchen"; break;
      case "waiter": username = "pizzapalace_waiter"; break;
    }
    if (username) setAutofill({ username, password });
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-8 overflow-hidden bg-[#050505]">
      {/* Dynamic Background */}
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        <Image 
          src="/bg.png" 
          alt="Restaurant Background" 
          fill
          priority
          className="object-cover opacity-40 scale-105"
          sizes="100vw"
        />
        {/* Gradient Overlay for legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-[#050505]/80 to-[#050505] mix-blend-multiply" />
      </div>

      {/* Floating Ambient Lighting */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] bg-orange-600/30 rounded-full blur-[140px]"
        />
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute -bottom-[20%] -left-[10%] w-[600px] h-[600px] bg-amber-700/20 rounded-full blur-[150px]"
        />
      </div>

      {/* Main Central Card */}
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[480px] relative z-10"
      >
        {/* Logo Header */}
        <div className="text-center mb-10">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 15, delay: 0.2 }}
            className="w-24 h-24 mx-auto rounded-[2rem] bg-gradient-to-br from-orange-400 to-amber-600 flex items-center justify-center shadow-[0_0_50px_rgba(249,115,22,0.25)] ring-1 ring-white/20 mb-6 backdrop-blur-md"
          >
            <ChefHat className="w-12 h-12 text-white drop-shadow-lg" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-5xl sm:text-6xl font-black text-white tracking-tight drop-shadow-sm"
          >
            Order<span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400">Pro</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-4 text-base text-zinc-300 font-light tracking-widest uppercase"
          >
            Elevating Fine Dining
          </motion.p>
        </div>

        {/* The Glass Container */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="rounded-[2.5rem] bg-black/40 backdrop-blur-3xl border border-white/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.6)] p-8 sm:p-10 relative overflow-hidden"
        >
          {/* Inner Highlights */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-transparent pointer-events-none" />

          <div className="relative z-10">
            <h2 className="text-2xl font-semibold text-white mb-8 tracking-wide">Sign In</h2>
            <LoginForm autofill={autofill} />

            {/* Forgot password section */}
            <div className="mt-8 border-t border-white/10 pt-6">
              <button
                type="button"
                onClick={() => setShowForgot((prev) => !prev)}
                className="w-full text-sm font-medium text-zinc-400 hover:text-white transition-colors duration-300 flex items-center justify-center gap-2 group"
              >
                {showForgot ? "Hide support options" : "Need help logging in?"}
              </button>

              <AnimatePresence>
                {showForgot && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-6">
                      <ForgotPassword />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Roles Hint */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-8"
        >
          <p className="text-center text-xs text-zinc-500 mb-4 uppercase tracking-widest font-semibold">
            Click to autofill
          </p>
          <RoleBadgesRow onSelectRole={handleRoleSelect} />
        </motion.div>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center text-[10px] text-zinc-500/70 mt-10 font-bold tracking-[0.2em] uppercase"
        >
          &copy; {new Date().getFullYear()} Order-Pro. All rights reserved.
        </motion.p>
      </motion.div>
    </div>
  );
}
