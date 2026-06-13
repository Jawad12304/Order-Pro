"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, User, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

// Local credential store for demo purposes
const CREDENTIALS: Record<string, { password: string; role: string; displayName: string }> = {
  superadmin: { password: "superadmin123", role: "superadmin", displayName: "Super Administrator" },
  admin: { password: "admin123", role: "admin", displayName: "Restaurant Admin" },
};

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { supabase } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const usernameStr = email.toLowerCase().trim();
    const demoUser = CREDENTIALS[usernameStr];

    // Demo Mode Fallback
    if (demoUser && demoUser.password === password) {
      const authData = {
        username: usernameStr,
        role: demoUser.role,
        displayName: demoUser.displayName,
        loggedInAt: new Date().toISOString(),
      };
      document.cookie = `order-pro-auth=${encodeURIComponent(JSON.stringify(authData))}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
      
      // Force refresh to trigger middleware
      window.location.href = demoUser.role === "superadmin" ? "/superadmin" : "/dashboard";
      return;
    }

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      if (data?.session) {
        window.location.href = "/dashboard";
      }
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-5">
      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400 flex items-start gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
          <Lock className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-zinc-300 mb-1.5" htmlFor="email">
          Email or Username
        </label>
        <div className="relative">
          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500" />
          <input
            id="email"
            type="text"
            required
            autoComplete="username"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-zinc-700/80 bg-zinc-800/60 pl-11 pr-4 py-3 text-white text-sm placeholder:text-zinc-500 focus:border-orange-500/70 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all duration-200"
            placeholder="Enter your email or username"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-zinc-300 mb-1.5" htmlFor="password">
          Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500" />
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-zinc-700/80 bg-zinc-800/60 pl-11 pr-12 py-3 text-white text-sm placeholder:text-zinc-500 focus:border-orange-500/70 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all duration-200"
            placeholder="Enter your password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors p-0.5"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-orange-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-orange-600/25 hover:from-orange-500 hover:to-orange-400 hover:shadow-orange-500/30 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98]"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Signing in...
          </>
        ) : (
          <>
            Sign In
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  );
}
