"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Utensils, Search, ShoppingCart, Receipt } from "lucide-react";

function BottomNavContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString() ? `?${searchParams.toString()}` : "";

  const navItems = [
    { label: "Menu", href: `/menu${queryString}`, basePath: "/menu", icon: Utensils },
    { label: "Search", href: `/menu/search${queryString}`, basePath: "/menu/search", icon: Search },
    { label: "Cart", href: `/cart${queryString}`, basePath: "/cart", icon: ShoppingCart },
    { label: "Orders", href: `/order/history${queryString}`, basePath: "/order/history", icon: Receipt },
  ];

  return (
    <nav className="bg-surface/80 dark:bg-surface/80 backdrop-blur-2xl shadow-lg fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-4 pt-2 border-t border-outline-variant/20">
      {navItems.map((item) => {
        const isActive = item.basePath === "/menu"
          ? pathname === "/menu"
          : pathname.startsWith(item.basePath);
        const Icon = item.icon;

        if (isActive) {
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center bg-primary-container text-on-primary-container rounded-full px-4 py-1 transform scale-100 transition-transform"
            >
              <Icon className="w-6 h-6" strokeWidth={2.5} />
              <span className="text-label-caps font-label-caps mt-0.5">{item.label}</span>
            </Link>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary transition-all scale-90"
          >
            <Icon className="w-6 h-6" strokeWidth={2} />
            <span className="text-label-caps font-label-caps mt-0.5">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default function BottomNavigation() {
  return (
    <Suspense fallback={null}>
      <BottomNavContent />
    </Suspense>
  );
}
