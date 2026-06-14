// ==========================================
// Order-Pro — Role Badges
//
// Visual legend showing the available user roles. RoleBadge renders a single
// pill-style indicator; RoleBadgesRow renders the full set as a horizontal
// row for display below the login form.
// ==========================================

import { Shield, ShieldAlert, User, ChefHat } from "lucide-react";
import React from "react";

export type UserRole = "superadmin" | "admin" | "waiter" | "kitchen" | "manager";

interface RoleBadgeProps {
  role: UserRole | string;
  className?: string;
  showIcon?: boolean;
  onClick?: () => void;
}

export function RoleBadge({ role, className = "", showIcon = true, onClick }: RoleBadgeProps) {
  const normalizedRole = role.toLowerCase();
  
  const baseClasses = `inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-inset transition-all duration-200 ${onClick ? "cursor-pointer hover:scale-105" : ""} ${className}`;

  switch (normalizedRole) {
    case "superadmin":
    case "super_admin":
      return (
        <span
          onClick={onClick}
          className={`${baseClasses} bg-purple-500/10 text-purple-400 ring-purple-500/20 hover:bg-purple-500/20`}
        >
          {showIcon && <ShieldAlert className="w-3.5 h-3.5" />}
          Super Admin
        </span>
      );
    case "admin":
    case "restaurant_admin":
      return (
        <span
          onClick={onClick}
          className={`${baseClasses} bg-blue-500/10 text-blue-400 ring-blue-500/20 hover:bg-blue-500/20`}
        >
          {showIcon && <Shield className="w-3.5 h-3.5" />}
          Admin
        </span>
      );
    case "waiter":
      return (
        <span
          onClick={onClick}
          className={`${baseClasses} bg-emerald-500/10 text-emerald-400 ring-emerald-500/20 hover:bg-emerald-500/20`}
        >
          {showIcon && <User className="w-3.5 h-3.5" />}
          Waiter
        </span>
      );
    case "kitchen":
      return (
        <span
          onClick={onClick}
          className={`${baseClasses} bg-orange-500/10 text-orange-400 ring-orange-500/20 hover:bg-orange-500/20`}
        >
          {showIcon && <ChefHat className="w-3.5 h-3.5" />}
          Kitchen
        </span>
      );
    default:
      return (
        <span
          onClick={onClick}
          className={`${baseClasses} bg-zinc-500/10 text-zinc-400 ring-zinc-500/20 hover:bg-zinc-500/20`}
        >
          {showIcon && <User className="w-3.5 h-3.5" />}
          {role}
        </span>
      );
  }
}

/**
 * Horizontal row of all 4 role badges for display below the login form.
 */
export function RoleBadgesRow({ onSelectRole }: { onSelectRole?: (role: UserRole) => void }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <RoleBadge role="superadmin" onClick={() => onSelectRole?.("superadmin")} />
      <RoleBadge role="admin" onClick={() => onSelectRole?.("admin")} />
      <RoleBadge role="kitchen" onClick={() => onSelectRole?.("kitchen")} />
      <RoleBadge role="waiter" onClick={() => onSelectRole?.("waiter")} />
    </div>
  );
}
