"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Utensils, Search, ShoppingCart, Receipt } from "lucide-react";

export default function BottomNavigation() {
  const pathname = usePathname();

  const navItems = [
    { label: "Menu", href: "/menu", icon: Utensils },
    { label: "Search", href: "/menu/search", icon: Search },
    { label: "Cart", href: "/cart", icon: ShoppingCart },
    { label: "Orders", href: "/order/history", icon: Receipt },
  ];

  return (
    <nav className="bg-surface/80 dark:bg-surface-dim/80 backdrop-blur-2xl docked full-width bottom-0 rounded-t-xl shadow-lg fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-4 pt-2">
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== "/menu" && pathname.startsWith(item.href));
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
