"use client";

// ==========================================
// Order-Pro — Forgot Password (Informational Accordion)
//
// Client-side only — no API calls. Explains how each role can get their
// password reset: Admins contact the Super Admin / account manager, and
// Kitchen / Waiter staff contact their Restaurant Admin.
// ==========================================

import { useState } from "react";
import { ChevronDown, Shield, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TabProps {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}

function AccordionTab({ label, icon, children, isActive, onClick }: TabProps) {
  return (
    <div className="border border-white/5 bg-white/[0.02] backdrop-blur-sm rounded-2xl overflow-hidden transition-all duration-300 hover:border-white/10 hover:bg-white/[0.04]">
      <button
        type="button"
        onClick={onClick}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left transition-colors duration-200 focus:outline-none focus:bg-white/[0.06]"
        aria-expanded={isActive}
      >
        <span className="flex items-center gap-3 text-sm font-semibold text-zinc-300 tracking-wide">
          {icon}
          {label}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-zinc-500 transition-transform duration-300 ease-out ${
            isActive ? "rotate-180 text-orange-400" : ""
          }`}
        />
      </button>

      <AnimatePresence initial={false}>
        {isActive && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
          >
            <div className="px-5 pb-5 pt-1 text-sm text-zinc-400 leading-relaxed font-light border-t border-white/5 mx-5 mt-2">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ForgotPassword() {
  const [activeTab, setActiveTab] = useState<string | null>(null);

  const toggle = (tab: string) => {
    setActiveTab((prev) => (prev === tab ? null : tab));
  };

  return (
    <div className="space-y-3">
      <AccordionTab
        label="Admin / Restaurant Admin"
        icon={<Shield className="w-4 h-4 text-blue-400" />}
        isActive={activeTab === "admin"}
        onClick={() => toggle("admin")}
      >
        <p className="mt-2">
          Contact your <span className="text-white font-medium">Order-Pro account manager</span> or
          the <span className="text-white font-medium">Super Admin</span> to have your password
          reset. They can update your credentials from the admin panel.
        </p>
      </AccordionTab>

      <AccordionTab
        label="Kitchen / Waiter Staff"
        icon={<Users className="w-4 h-4 text-emerald-400" />}
        isActive={activeTab === "staff"}
        onClick={() => toggle("staff")}
      >
        <p className="mt-2">
          Contact your <span className="text-white font-medium">Restaurant Administrator</span> to
          reset your password. They can change it for you from the staff management section.
        </p>
      </AccordionTab>
    </div>
  );
}
