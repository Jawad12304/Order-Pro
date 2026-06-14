"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Menu as MenuIcon, UtensilsCrossed, QrCode, ClipboardList, Settings, LogOut, X, BarChart3 } from "lucide-react";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { SocketProvider } from "@/context/SocketContext";
import { apiLogout, apiGetMe } from "@/lib/api";

import { ThemeToggle } from "@/components/ui/ThemeToggle";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/menu", label: "Menu Management", icon: UtensilsCrossed },
  { href: "/dashboard/tables", label: "Table Management", icon: QrCode },
  { href: "/dashboard/orders", label: "Live Orders", icon: ClipboardList },
];

interface AuthData {
  username: string;
  role: string;
  displayName: string;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [auth, setAuth] = useState<AuthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function resolveAuth() {
      // 1. Try localStorage first (fast path)
      const stored = localStorage.getItem("order-pro-auth");
      if (stored) {
        try {
          setAuth(JSON.parse(stored));
          setLoading(false);
          return;
        } catch {
          // corrupted — fall through to API
        }
      }

      // 2. Fallback: ask the API using the httpOnly cookie
      try {
        const me = await apiGetMe();
        if (me) {
          const authData: AuthData = {
            username: me.username,
            role: me.role,
            displayName: me.username,
          };
          localStorage.setItem("order-pro-auth", JSON.stringify(authData));
          setAuth(authData);
          setLoading(false);
          return;
        }
      } catch {}

      // 3. Not authenticated at all — redirect to login
      router.push("/");
    }
    resolveAuth();
  }, [router]);

  const handleLogout = async () => {
    try { await apiLogout(); } catch {}
    localStorage.removeItem("order-pro-auth");
    router.push("/");
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!auth) return null;

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-surface border-r border-outline-variant/30 text-on-surface w-64 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-8 px-2 mt-2">
        <div className="bg-primary text-on-primary p-1.5 rounded-lg">
          <UtensilsCrossed size={24} />
        </div>
        <h1 className="text-title-lg font-bold tracking-tight text-primary">Order Pro</h1>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = item.href === "/dashboard" 
            ? pathname === "/dashboard" 
            : (pathname === item.href || pathname.startsWith(`${item.href}/`));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-body-md ${
                isActive 
                  ? "bg-primary text-on-primary shadow-sm" 
                  : "text-on-surface hover:bg-surface-variant hover:text-on-surface"
              }`}
            >
              <Icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-outline-variant/30 pt-4 space-y-2">
        <Link 
          href="/dashboard/settings" 
          onClick={() => setIsMobileMenuOpen(false)} 
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-body-md ${
            pathname === "/dashboard/settings" || pathname.startsWith("/dashboard/settings/")
              ? "bg-primary text-on-primary shadow-sm"
              : "text-on-surface hover:bg-surface-variant hover:text-on-surface"
          }`}
        >
          <Settings size={20} />
          Settings
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-error hover:bg-error-container text-body-md font-medium"
        >
          <LogOut size={20} />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <QueryProvider>
      <SocketProvider>
        <div className="flex h-screen bg-background w-full overflow-hidden">
          
          {/* Desktop Sidebar */}
          <aside className="hidden md:block shrink-0 h-full">
            <SidebarContent />
          </aside>

          {/* Mobile Overlay Sidebar */}
          {isMobileMenuOpen && (
            <div className="fixed inset-0 z-50 flex md:hidden">
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
              <div className="relative w-64 h-full z-10 transform transition-transform duration-300">
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

          {/* Main Content */}
          <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Top Header */}
            <header className="h-16 shrink-0 bg-surface/80 backdrop-blur-md border-b border-outline-variant/30 flex items-center justify-between px-4 lg:px-8 shadow-sm z-10">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="p-2 -ml-2 rounded-lg text-on-surface-variant hover:bg-surface-variant md:hidden"
                >
                  <MenuIcon size={24} />
                </button>
                
                <h2 className="text-title-lg font-bold text-on-surface capitalize hidden sm:block">
                  {pathname.split("/").pop() === "dashboard" ? "Overview" : pathname.split("/").pop()}
                </h2>
              </div>

              <div className="flex items-center gap-4">
                <ThemeToggle />
                <div className="w-px h-8 bg-outline-variant/50 hidden sm:block"></div>
                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <p className="text-label-lg font-semibold text-on-surface">{auth.displayName}</p>
                    <p className="text-label-sm text-on-surface-variant capitalize">{auth.role}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-primary/20 border-2 border-primary/50 flex items-center justify-center text-primary font-bold shadow-inner">
                    {auth.displayName.charAt(0).toUpperCase()}
                  </div>
                </div>
              </div>
            </header>

            {/* Scrollable Page Content */}
            <div className="flex-1 overflow-auto bg-surface-container-lowest p-4 lg:p-8">
              {children}
            </div>
          </main>

        </div>
      </SocketProvider>
    </QueryProvider>
  );
}
