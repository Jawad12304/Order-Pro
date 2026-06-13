import { Shield, ShieldAlert, User } from "lucide-react";
import React from "react";

export type UserRole = "superadmin" | "admin" | "waiter" | "kitchen";

interface RoleBadgeProps {
  role: UserRole | string;
  className?: string;
  showIcon?: boolean;
}

export function RoleBadge({ role, className = "", showIcon = true }: RoleBadgeProps) {
  const normalizedRole = role.toLowerCase();

  switch (normalizedRole) {
    case "superadmin":
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-md bg-purple-500/10 px-2 py-1 text-xs font-semibold text-purple-400 ring-1 ring-inset ring-purple-500/20 ${className}`}
        >
          {showIcon && <ShieldAlert className="w-3.5 h-3.5" />}
          Super Admin
        </span>
      );
    case "admin":
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-md bg-blue-500/10 px-2 py-1 text-xs font-semibold text-blue-400 ring-1 ring-inset ring-blue-500/20 ${className}`}
        >
          {showIcon && <Shield className="w-3.5 h-3.5" />}
          Admin
        </span>
      );
    case "waiter":
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-400 ring-1 ring-inset ring-emerald-500/20 ${className}`}
        >
          {showIcon && <User className="w-3.5 h-3.5" />}
          Waiter
        </span>
      );
    case "kitchen":
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-md bg-orange-500/10 px-2 py-1 text-xs font-semibold text-orange-400 ring-1 ring-inset ring-orange-500/20 ${className}`}
        >
          {showIcon && <User className="w-3.5 h-3.5" />}
          Kitchen
        </span>
      );
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-md bg-zinc-500/10 px-2 py-1 text-xs font-semibold text-zinc-400 ring-1 ring-inset ring-zinc-500/20 ${className}`}
        >
          {showIcon && <User className="w-3.5 h-3.5" />}
          {role}
        </span>
      );
  }
}
