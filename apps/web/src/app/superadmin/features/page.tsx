"use client";

import React, { useState } from "react";
import { Search, ToggleRight, Server, ShieldCheck, Check } from "lucide-react";

type FeatureFlags = {
  analytics: boolean;
  inventory: boolean;
  whatsapp: boolean;
  custom_domain: boolean;
};

const initialRestaurants = [
  { id: "r1", name: "Luigi's Trattoria", plan: "Pro", flags: { analytics: true, inventory: true, whatsapp: false, custom_domain: true } },
  { id: "r2", name: "Burger Joint", plan: "Starter", flags: { analytics: true, inventory: false, whatsapp: false, custom_domain: false } },
  { id: "r3", name: "Sushi Central", plan: "Enterprise", flags: { analytics: true, inventory: true, whatsapp: true, custom_domain: true } },
  { id: "r4", name: "Cafe Mocha", plan: "Free", flags: { analytics: false, inventory: false, whatsapp: false, custom_domain: false } },
];

export default function SuperAdminFeatureFlags() {
  const [restaurants, setRestaurants] = useState(initialRestaurants);
  const [savingId, setSavingId] = useState<string | null>(null);

  const toggleFlag = (restaurantId: string, feature: keyof FeatureFlags) => {
    setRestaurants(restaurants.map(r => {
      if (r.id === restaurantId) {
        return { ...r, flags: { ...r.flags, [feature]: !r.flags[feature] } };
      }
      return r;
    }));
    
    // Simulate API save
    setSavingId(restaurantId);
    setTimeout(() => setSavingId(null), 800);
  };

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-headline-sm font-bold text-on-surface">Global Feature Flags</h1>
          <p className="text-body-md text-on-surface-variant mt-1">Granular access control matrix for all platform features.</p>
        </div>
        
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
          <input 
            type="text" 
            placeholder="Find tenant to override..." 
            className="w-full bg-surface border border-outline-variant/50 rounded-xl py-2 pl-10 pr-4 text-body-sm focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      <div className="bg-surface border border-outline-variant/30 rounded-2xl shadow-sm overflow-hidden">
        
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 p-4 bg-surface-container-low border-b border-outline-variant/30 text-label-xs font-bold text-on-surface-variant uppercase tracking-wider items-center">
          <div className="col-span-4">Tenant Identity</div>
          <div className="col-span-2 text-center">Analytics Hub</div>
          <div className="col-span-2 text-center">Inventory</div>
          <div className="col-span-2 text-center">WhatsApp</div>
          <div className="col-span-2 text-center">Custom Domain</div>
        </div>

        {/* Matrix Rows */}
        <div className="divide-y divide-outline-variant/20">
          {restaurants.map((tenant) => (
            <div key={tenant.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-surface-container-lowest transition-colors relative">
              
              {/* Saving Indicator Overlay */}
              {savingId === tenant.id && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-label-sm font-bold text-green-600 bg-green-500/10 px-2.5 py-1 rounded-full animate-in fade-in zoom-in">
                  <Check size={14} /> Saved
                </div>
              )}

              <div className="col-span-4">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-on-surface">{tenant.name}</span>
                  {tenant.plan === 'Enterprise' && <ShieldCheck size={14} className="text-orange-500" />}
                </div>
                <div className="text-label-sm text-on-surface-variant mt-0.5">{tenant.plan} Plan</div>
              </div>

              {/* Analytics Toggle */}
              <div className="col-span-2 flex justify-center">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={tenant.flags.analytics} onChange={() => toggleFlag(tenant.id, "analytics")} />
                  <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {/* Inventory Toggle */}
              <div className="col-span-2 flex justify-center">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={tenant.flags.inventory} onChange={() => toggleFlag(tenant.id, "inventory")} />
                  <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {/* WhatsApp Toggle */}
              <div className="col-span-2 flex justify-center">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={tenant.flags.whatsapp} onChange={() => toggleFlag(tenant.id, "whatsapp")} />
                  <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {/* Custom Domain Toggle */}
              <div className="col-span-2 flex justify-center">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={tenant.flags.custom_domain} onChange={() => toggleFlag(tenant.id, "custom_domain")} />
                  <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
