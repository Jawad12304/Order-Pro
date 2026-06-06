import React from "react";
import Link from "next/link";
import { LayoutDashboard, Store, CreditCard, ToggleRight, Settings, LogOut } from "lucide-react";

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  // Hardcoded auth check mock - in a real app this would use middleware
  const isSuperAdmin = true;

  if (!isSuperAdmin) {
    return <div className="p-8 text-center text-error">Access Denied</div>;
  }

  return (
    <div className="flex h-screen bg-surface-container-lowest text-on-surface">
      {/* Super Admin Sidebar */}
      <aside className="w-64 bg-surface border-r border-outline-variant/30 flex flex-col">
        <div className="p-6 border-b border-outline-variant/30">
          <h1 className="text-title-lg font-black text-primary tracking-tight">Order Pro</h1>
          <p className="text-label-sm font-bold text-on-surface-variant uppercase tracking-wider mt-1">Super Admin</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <Link href="/superadmin" className="flex items-center gap-3 px-4 py-3 rounded-xl text-body-md font-medium hover:bg-surface-variant transition-colors text-on-surface">
            <LayoutDashboard size={20} />
            Overview
          </Link>
          <Link href="/superadmin/restaurants" className="flex items-center gap-3 px-4 py-3 rounded-xl text-body-md font-medium hover:bg-surface-variant transition-colors text-on-surface">
            <Store size={20} />
            Restaurants
          </Link>
          <Link href="/superadmin/billing" className="flex items-center gap-3 px-4 py-3 rounded-xl text-body-md font-medium hover:bg-surface-variant transition-colors text-on-surface">
            <CreditCard size={20} />
            Billing & Plans
          </Link>
          <Link href="/superadmin/features" className="flex items-center gap-3 px-4 py-3 rounded-xl text-body-md font-medium hover:bg-surface-variant transition-colors text-on-surface">
            <ToggleRight size={20} />
            Feature Flags
          </Link>
        </nav>

        <div className="p-4 border-t border-outline-variant/30 space-y-1">
          <Link href="/superadmin/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl text-body-md font-medium hover:bg-surface-variant transition-colors text-on-surface-variant">
            <Settings size={20} />
            Platform Settings
          </Link>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-body-md font-medium hover:bg-error-container hover:text-on-error-container transition-colors text-error">
            <LogOut size={20} />
            Exit Portal
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-outline-variant/30 bg-surface px-8 flex items-center justify-between shrink-0">
          <h2 className="text-title-md font-bold">God Mode</h2>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-label-sm">
              SA
            </div>
            <span className="text-label-sm font-bold">jh404@example.com</span>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
}
