"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createRestaurantAction, createFirstTableAction } from "@/app/actions/onboarding";

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Step 1 is already complete if they reached this page via signup

  const handleRestaurantSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await createRestaurantAction(formData);

    if (result.error) {
      setError(result.error);
    } else if (result.success && result.restaurantId) {
      setRestaurantId(result.restaurantId);
      setStep(2);
    }
    
    setLoading(false);
  };

  const handleTableSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!restaurantId) return;
    
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await createFirstTableAction(restaurantId, formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
    // If successful, the action will redirect to /dashboard
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-zinc-900 p-8 shadow-xl border border-zinc-800">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white">
            {step === 1 ? "Set up your Restaurant" : "Add your first Table"}
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            {step === 1 ? "Tell us about your business" : "Let's set up your dining room"}
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-500/10 p-4 text-sm text-red-500 border border-red-500/20">
            {error}
          </div>
        )}

        {step === 1 ? (
          <form className="mt-8 space-y-6" onSubmit={handleRestaurantSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300" htmlFor="name">
                  Restaurant Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  placeholder="Pizza Palace"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300" htmlFor="currency">
                    Currency
                  </label>
                  <select
                    id="currency"
                    name="currency"
                    className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300" htmlFor="themeColor">
                    Theme Color
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      id="themeColor"
                      name="themeColor"
                      type="color"
                      defaultValue="#F97316"
                      className="h-10 w-10 cursor-pointer rounded bg-transparent p-0 border-0"
                    />
                    <span className="text-sm text-zinc-400">Primary Color</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:opacity-50 transition-colors"
            >
              {loading ? "Saving..." : "Continue"}
            </button>
          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleTableSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300" htmlFor="tableNumber">
                  Table Number
                </label>
                <input
                  id="tableNumber"
                  name="tableNumber"
                  type="number"
                  min="1"
                  required
                  className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  placeholder="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300" htmlFor="capacity">
                  Seating Capacity
                </label>
                <input
                  id="capacity"
                  name="capacity"
                  type="number"
                  min="1"
                  required
                  defaultValue="4"
                  className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  placeholder="4"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:opacity-50 transition-colors"
            >
              {loading ? "Completing Setup..." : "Complete Setup"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
