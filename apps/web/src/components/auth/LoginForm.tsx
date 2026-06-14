"use client";

// ==========================================
// Order-Pro — Login Form
//
// Submits username/password to the custom Express API via apiLogin().
// On success, redirects to the role-specific dashboard. On error, shakes
// the form and displays the server error message.
// ==========================================

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, User, ArrowRight, AlertCircle } from "lucide-react";
import { apiLogin, getApiErrorMessage } from "@/lib/api";
import { motion } from "framer-motion";

interface LoginFormProps {
  autofill?: { username: string; password: string };
}

export function LoginForm({ autofill }: LoginFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [shaking, setShaking] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (autofill) {
      setUsername(autofill.username);
      setPassword(autofill.password);
    }
  }, [autofill]);

  const triggerShake = () => {
    setShaking(true);
    setTimeout(() => setShaking(false), 600);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await apiLogin(username.trim(), password);
      // Store auth info for the dashboard layouts to display user info.
      localStorage.setItem(
        "order-pro-auth",
        JSON.stringify({
          username: result.username,
          role: result.role,
          displayName: result.restaurant_name
            ? `${result.username} (${result.restaurant_name})`
            : result.username,
        })
      );
      // The backend has set httpOnly cookies — navigate to the role dashboard.
      router.push(result.redirect_url);
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      setError(message);
      triggerShake();
      setLoading(false);
    }
  };

  return (
    <motion.form
      ref={formRef}
      onSubmit={handleLogin}
      animate={shaking ? { x: [-10, 10, -10, 10, -5, 5, 0] } : {}}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Error banner */}
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-red-500/10 backdrop-blur-md border border-red-500/20 px-4 py-3.5 text-sm text-red-400 flex items-start gap-3 shadow-inner"
        >
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span className="font-medium">{error}</span>
        </motion.div>
      )}

      <div className="space-y-5">
        {/* Username */}
        <div className="space-y-1.5">
          <label
            className="block text-sm font-semibold text-zinc-300 ml-1 tracking-wide"
            htmlFor="login-username"
          >
            Username
          </label>
          <div className="relative group">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-orange-400 transition-colors duration-300" />
            <input
              id="login-username"
              type="text"
              required
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-2xl border border-white/5 bg-white/[0.04] backdrop-blur-md pl-12 pr-4 py-3.5 text-white text-sm placeholder:text-zinc-600 focus:border-orange-500/50 focus:bg-white/[0.08] focus:outline-none focus:ring-4 focus:ring-orange-500/10 transition-all duration-300 hover:bg-white/[0.06]"
              placeholder="Enter your username"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label
            className="block text-sm font-semibold text-zinc-300 ml-1 tracking-wide"
            htmlFor="login-password"
          >
            Password
          </label>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-orange-400 transition-colors duration-300" />
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-white/5 bg-white/[0.04] backdrop-blur-md pl-12 pr-12 py-3.5 text-white text-sm placeholder:text-zinc-600 focus:border-orange-500/50 focus:bg-white/[0.08] focus:outline-none focus:ring-4 focus:ring-orange-500/10 transition-all duration-300 hover:bg-white/[0.06]"
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors duration-300 p-1 rounded-md hover:bg-white/5"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <button
        id="login-submit"
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-rose-500 px-4 py-4 text-sm font-bold text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 focus:outline-none focus:ring-4 focus:ring-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 relative overflow-hidden group"
      >
        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
        <span className="relative flex items-center gap-2">
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Authenticating...
            </>
          ) : (
            <>
              Sign In Securely
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
            </>
          )}
        </span>
      </button>
    </motion.form>
  );
}
