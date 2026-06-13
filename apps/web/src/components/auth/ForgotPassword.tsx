"use client";

import { useState } from "react";
import { Mail, ArrowRight, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { supabase } = useAuth();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (resetError) {
        throw resetError;
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
        </div>
        <h3 className="text-xl font-bold text-white">Check your email</h3>
        <p className="text-sm text-zinc-400">
          We've sent a password reset link to <span className="text-zinc-200 font-medium">{email}</span>.
        </p>
        <Link 
          href="/login" 
          className="inline-block mt-4 text-sm font-semibold text-orange-500 hover:text-orange-400 transition-colors"
        >
          Return to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleReset} className="space-y-5">
      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400 flex items-start gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
          <Mail className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-zinc-300 mb-1.5" htmlFor="reset-email">
          Email Address
        </label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500" />
          <input
            id="reset-email"
            type="email"
            required
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-zinc-700/80 bg-zinc-800/60 pl-11 pr-4 py-3 text-white text-sm placeholder:text-zinc-500 focus:border-orange-500/70 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all duration-200"
            placeholder="Enter your email"
          />
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
            Sending...
          </>
        ) : (
          <>
            Send Reset Link
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      <div className="text-center mt-4">
        <Link 
          href="/login" 
          className="text-sm font-medium text-zinc-400 hover:text-zinc-300 transition-colors"
        >
          Back to sign in
        </Link>
      </div>
    </form>
  );
}
