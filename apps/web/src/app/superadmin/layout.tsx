"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Store, CreditCard, ToggleRight, Settings, LogOut, Menu, X } from "lucide-react";

interface AuthData {
  username: string;
  role: string;
  displayName: string;
}

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("order-pro-auth");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.role === "superadmin") {
          setAuth(parsed);
        } else {
          router.push("/dashboard");
          return;
        }
      } catch {
        router.push("/login");
        return;
      }
    } else {
      router.push("/login");
      return;
    }
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("order-pro-auth");
    document.cookie = "order-pro-auth=; path=/; max-age=0";
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-container-lowest">
        <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!auth) return null;

  const navItems = [
    { href: "/superadmin", label: "Overview", icon: LayoutDashboard },
    { href: "/superadmin/restaurants", label: "Restaurants", icon: Store },
    { href: "/superadmin/billing", label: "Billing & Plans", icon: CreditCard },
    { href: "/superadmin/features", label: "Feature Flags", icon: ToggleRight },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-surface border-r border-outline-variant/30">
      <div className="p-6 border-b border-outline-variant/30">
        <h1 className="text-title-lg font-black text-primary tracking-tight">Order Pro</h1>
        <p className="text-label-sm font-bold text-on-surface-variant uppercase tracking-wider mt-1">Super Admin</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-body-md font-medium transition-colors ${
                isActive
                  ? "bg-primary text-on-primary shadow-sm"
                  : "text-on-surface hover:bg-surface-variant"
              }`}
            >
              <Icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-outline-variant/30 space-y-1">
        <Link
          href="/superadmin/settings"
          onClick={() => setIsMobileMenuOpen(false)}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-body-md font-medium hover:bg-surface-variant transition-colors text-on-surface-variant"
        >
          <Settings size={20} />
          Platform Settings
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-body-md font-medium hover:bg-error-container hover:text-on-error-container transition-colors text-error"
        >
          <LogOut size={20} />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-surface-container-lowest text-on-surface">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 shrink-0 h-full">
        <SidebarContent />
      </aside>

      {/* Mobile Overlay Sidebar */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="relative w-64 h-full z-10">
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute right-4 top-4 p-2 bg-surface rounded-full shadow-md z-20"
            >
              <X size={20} />
            </button>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-16 border-b border-outline-variant/30 bg-surface px-4 sm:px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 rounded-lg text-on-surface-variant hover:bg-surface-variant md:hidden"
            >
              <Menu size={24} />
            </button>
            <h2 className="text-title-md font-bold">God Mode</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-label-sm">
              SA
            </div>
            <span className="text-label-sm font-bold hidden sm:block">{auth.displayName}</span>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
}
