"use client";

import React from "react";
import { CreditCard, ExternalLink, ArrowRight, Zap, Building2, CheckCircle2 } from "lucide-react";

export default function SuperAdminBilling() {
  const plans = [
    { name: "Free Tier", price: "$0", tables: 3, orders: "Unlimited", target: "Hobbyists & Food Trucks" },
    { name: "Starter", price: "$29", tables: 15, orders: "Unlimited", target: "Small Cafes" },
    { name: "Pro", price: "$79", tables: 50, orders: "Unlimited", target: "Busy Restaurants" },
    { name: "Enterprise", price: "Custom", tables: "Unlimited", orders: "Unlimited", target: "Multi-location Brands" },
  ];

  return (
    <div className="animate-in fade-in duration-300 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-headline-sm font-bold text-on-surface">Billing & Subscriptions</h1>
        <p className="text-body-md text-on-surface-variant mt-1">Manage global Stripe configurations and SaaS pricing plans.</p>
      </div>

      {/* Stripe Gateway Status */}
      <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#635BFF]/10 text-[#635BFF] rounded-xl flex items-center justify-center shrink-0">
            <CreditCard size={24} />
          </div>
          <div>
            <h3 className="text-title-md font-bold text-on-surface">Stripe Billing Portal</h3>
            <p className="text-body-sm text-on-surface-variant mt-0.5">Connected in Live Mode. Webhooks functioning normally.</p>
          </div>
        </div>
        <button className="flex items-center gap-2 bg-[#635BFF] text-white px-5 py-2.5 rounded-xl font-label-md shadow-sm hover:opacity-90 transition-opacity">
          Open Stripe Dashboard <ExternalLink size={16} />
        </button>
      </div>

      {/* Pricing Matrix */}
      <div>
        <h2 className="text-title-lg font-bold text-on-surface mb-4">Configured SaaS Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan, i) => (
            <div key={i} className={`bg-surface border p-6 rounded-2xl shadow-sm flex flex-col relative overflow-hidden
              ${plan.name === 'Pro' ? 'border-primary ring-1 ring-primary/20' : 'border-outline-variant/30'}`}
            >
              {plan.name === 'Pro' && (
                <div className="absolute top-0 right-0 bg-primary text-on-primary text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-lg">
                  Most Popular
                </div>
              )}
              
              <h4 className="text-title-md font-bold text-on-surface">{plan.name}</h4>
              <p className="text-body-sm text-on-surface-variant mt-1">{plan.target}</p>
              
              <div className="my-6">
                <span className="text-display-sm font-black text-on-surface">{plan.price}</span>
                {plan.price !== "Custom" && <span className="text-body-sm text-on-surface-variant">/mo</span>}
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                <li className="flex items-center gap-2 text-body-sm text-on-surface">
                  <CheckCircle2 size={16} className="text-primary shrink-0" />
                  <strong>{plan.tables}</strong> Tables max
                </li>
                <li className="flex items-center gap-2 text-body-sm text-on-surface">
                  <CheckCircle2 size={16} className="text-primary shrink-0" />
                  <strong>{plan.orders}</strong> Orders
                </li>
                {plan.name !== 'Free Tier' && (
                  <li className="flex items-center gap-2 text-body-sm text-on-surface">
                    <CheckCircle2 size={16} className="text-primary shrink-0" />
                    Advanced Analytics
                  </li>
                )}
              </ul>

              <button className={`w-full py-2.5 rounded-xl font-label-md transition-colors mt-auto
                ${plan.name === 'Pro' ? 'bg-primary text-on-primary hover:opacity-90' : 'bg-surface-variant text-on-surface-variant hover:bg-outline-variant/30'}`}
              >
                Edit Configuration
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Manual Downgrade/Upgrade Tool */}
      <div className="bg-surface border border-outline-variant/30 rounded-2xl shadow-sm p-6">
        <h2 className="text-title-md font-bold text-on-surface mb-1">Manual Subscription Override</h2>
        <p className="text-body-sm text-on-surface-variant mb-6">Force upgrade or downgrade a specific tenant outside of Stripe.</p>
        
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-label-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Select Restaurant</label>
            <select className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-3 text-body-md focus:border-primary focus:outline-none">
              <option>Luigi's Trattoria (Pro)</option>
              <option>Burger Joint (Starter)</option>
              <option>Cafe Mocha (Free)</option>
            </select>
          </div>
          
          <div className="shrink-0 text-outline-variant hidden md:block mb-3">
            <ArrowRight size={24} />
          </div>

          <div className="flex-1 w-full">
            <label className="block text-label-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">New Plan</label>
            <select className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-3 text-body-md focus:border-primary focus:outline-none">
              <option>Enterprise</option>
              <option>Pro</option>
              <option>Starter</option>
              <option>Free Tier</option>
            </select>
          </div>

          <button className="flex items-center justify-center gap-2 bg-error text-on-error px-6 py-3 rounded-xl font-label-md shadow-sm hover:opacity-90 transition-opacity w-full md:w-auto">
            <Zap size={18} /> Execute Override
          </button>
        </div>
      </div>

    </div>
  );
}
