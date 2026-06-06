"use client";

import React, { useState } from "react";
import { Search, Filter, MoreVertical, ShieldAlert, LogIn, ArrowUpCircle } from "lucide-react";
import { useRouter } from "next/navigation";

const mockRestaurants = [
  { id: "r1", name: "Luigi's Trattoria", owner: "luigi@example.com", plan: "Pro", tables: 24, ordersMo: 1420, status: "Active", joined: "2024-01-15" },
  { id: "r2", name: "Burger Joint", owner: "bob@burger.com", plan: "Starter", tables: 12, ordersMo: 850, status: "Active", joined: "2024-03-02" },
  { id: "r3", name: "Sushi Central", owner: "sato@sushi.com", plan: "Enterprise", tables: 40, ordersMo: 3200, status: "Active", joined: "2023-11-10" },
  { id: "r4", name: "Cafe Mocha", owner: "sarah@cafe.com", plan: "Free", tables: 3, ordersMo: 45, status: "Suspended", joined: "2024-05-20" },
];

export default function SuperAdminRestaurants() {
  const router = useRouter();
  const [restaurants, setRestaurants] = useState(mockRestaurants);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const handleImpersonate = (restaurantId: string, name: string) => {
    // In reality, this calls an API to generate an impersonation JWT, stores it in cookies, and redirects.
    alert(`Generating impersonation token for ${name}... Redirecting to their dashboard!`);
    router.push("/dashboard");
  };

  const toggleStatus = (id: string) => {
    setRestaurants(restaurants.map(r => 
      r.id === id ? { ...r, status: r.status === "Active" ? "Suspended" : "Active" } : r
    ));
    setOpenDropdown(null);
  };

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-headline-sm font-bold text-on-surface">Tenant Management</h1>
          <p className="text-body-md text-on-surface-variant mt-1">Manage all restaurant accounts and impersonate users.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
            <input 
              type="text" 
              placeholder="Search tenants..." 
              className="w-full bg-surface border border-outline-variant/50 rounded-xl py-2 pl-10 pr-4 text-body-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <button className="flex items-center gap-2 bg-surface border border-outline-variant/50 text-on-surface px-4 py-2 rounded-xl font-label-md hover:bg-surface-variant transition-colors shadow-sm">
            <Filter size={18} />
            Filter
          </button>
        </div>
      </div>

      <div className="bg-surface border border-outline-variant/30 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant/30 text-label-sm font-bold text-on-surface-variant uppercase tracking-wider">
                <th className="p-4">Restaurant</th>
                <th className="p-4">Owner Email</th>
                <th className="p-4">Plan</th>
                <th className="p-4">Usage (Tables/Mo)</th>
                <th className="p-4">Status</th>
                <th className="p-4">Joined</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {restaurants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-surface-container-lowest transition-colors">
                  <td className="p-4">
                    <span className="font-bold text-on-surface">{tenant.name}</span>
                  </td>
                  <td className="p-4 text-body-sm text-on-surface-variant">{tenant.owner}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-label-xs font-bold border 
                      ${tenant.plan === 'Enterprise' ? 'bg-orange-500/10 text-orange-600 border-orange-500/20' : 
                        tenant.plan === 'Pro' ? 'bg-purple-500/10 text-purple-600 border-purple-500/20' : 
                        tenant.plan === 'Starter' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' : 
                        'bg-surface-variant text-on-surface-variant border-outline-variant/30'}`}
                    >
                      {tenant.plan}
                    </span>
                  </td>
                  <td className="p-4 text-body-sm text-on-surface-variant">
                    {tenant.tables} / {tenant.ordersMo.toLocaleString()}
                  </td>
                  <td className="p-4">
                    <span className={`flex items-center gap-1.5 text-label-sm font-bold
                      ${tenant.status === 'Active' ? 'text-green-600' : 'text-error'}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${tenant.status === 'Active' ? 'bg-green-600' : 'bg-error'}`}></span>
                      {tenant.status}
                    </span>
                  </td>
                  <td className="p-4 text-body-sm text-on-surface-variant">{tenant.joined}</td>
                  <td className="p-4 text-right relative">
                    <button 
                      onClick={() => setOpenDropdown(openDropdown === tenant.id ? null : tenant.id)}
                      className="p-1.5 text-on-surface-variant hover:bg-surface-variant rounded-md transition-colors"
                    >
                      <MoreVertical size={20} />
                    </button>
                    
                    {openDropdown === tenant.id && (
                      <div className="absolute right-8 top-10 w-48 bg-surface-container-high border border-outline-variant/50 shadow-xl rounded-xl py-1 z-10 animate-in fade-in zoom-in-95 duration-100">
                        <button 
                          onClick={() => handleImpersonate(tenant.id, tenant.name)}
                          className="w-full text-left px-4 py-2 text-label-sm font-medium text-on-surface hover:bg-surface-variant flex items-center gap-2"
                        >
                          <LogIn size={16} /> Impersonate
                        </button>
                        <button className="w-full text-left px-4 py-2 text-label-sm font-medium text-on-surface hover:bg-surface-variant flex items-center gap-2">
                          <ArrowUpCircle size={16} /> Upgrade Plan
                        </button>
                        <div className="h-px bg-outline-variant/30 my-1"></div>
                        <button 
                          onClick={() => toggleStatus(tenant.id)}
                          className={`w-full text-left px-4 py-2 text-label-sm font-medium flex items-center gap-2
                            ${tenant.status === 'Active' ? 'text-error hover:bg-error-container' : 'text-green-600 hover:bg-green-500/10'}`}
                        >
                          <ShieldAlert size={16} /> {tenant.status === 'Active' ? 'Suspend Account' : 'Reactivate Account'}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
