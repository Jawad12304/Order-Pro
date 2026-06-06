"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, ChefHat, PartyPopper, Utensils, Clock } from "lucide-react";

export type OrderStatus = "PENDING" | "CONFIRMED" | "PREPARING" | "READY" | "SERVED" | "CANCELLED";

const steps = [
  { id: "PENDING", label: "Order Placed", icon: Clock },
  { id: "CONFIRMED", label: "Confirmed", icon: Check },
  { id: "PREPARING", label: "Preparing", icon: ChefHat },
  { id: "READY", label: "Ready!", icon: PartyPopper },
  { id: "SERVED", label: "Served", icon: Utensils },
];

export function OrderTimeline({ status }: { status: OrderStatus }) {
  const currentStepIndex = steps.findIndex((s) => s.id === status);
  
  // Local state to track "fake" prep time for demonstration purposes
  const [prepTimeLeft, setPrepTimeLeft] = useState(15); 

  useEffect(() => {
    if (status === "PREPARING") {
      const interval = setInterval(() => {
        setPrepTimeLeft(prev => Math.max(0, prev - 1));
      }, 60000); // 1 minute
      return () => clearInterval(interval);
    }
  }, [status]);

  if (status === "CANCELLED") {
    return (
      <div className="bg-error-container text-on-error-container p-6 rounded-2xl text-center">
        <h2 className="text-title-lg font-bold">Order Cancelled</h2>
        <p className="text-body-md mt-2">Your order has been cancelled.</p>
      </div>
    );
  }

  return (
    <div className="relative pl-6 py-4">
      {/* Vertical line connecting steps */}
      <div className="absolute left-[39px] top-8 bottom-8 w-[2px] bg-outline-variant/30 z-0"></div>
      
      {/* Animated progress line */}
      <motion.div 
        className="absolute left-[39px] top-8 w-[2px] bg-primary z-0"
        initial={{ height: 0 }}
        animate={{ 
          height: currentStepIndex > 0 ? `${(currentStepIndex / (steps.length - 1)) * 100}%` : 0 
        }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      />

      <div className="space-y-8 relative z-10">
        {steps.map((step, idx) => {
          const isCompleted = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;
          const isFuture = idx > currentStepIndex;

          const Icon = step.icon;

          return (
            <div key={step.id} className="flex items-start gap-4">
              <motion.div
                initial={false}
                animate={{
                  backgroundColor: isCompleted || isCurrent ? "var(--theme-primary)" : "var(--theme-surface)",
                  borderColor: isCompleted || isCurrent ? "var(--theme-primary)" : "rgba(150,150,150,0.3)",
                  color: isCompleted || isCurrent ? "#ffffff" : "var(--theme-on-surface-variant)",
                  scale: isCurrent ? 1.1 : 1,
                }}
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 shadow-sm ${
                  isCurrent ? "ring-4 ring-primary/20" : ""
                }`}
              >
                <Icon size={16} />
              </motion.div>
              
              <div className={`mt-1 transition-opacity duration-300 ${isFuture ? "opacity-50" : "opacity-100"}`}>
                <h4 className={`text-title-md font-bold ${isCurrent ? "text-primary" : "text-on-surface"}`}>
                  {step.label}
                </h4>
                
                {/* Specific Step Content */}
                {isCurrent && step.id === "PREPARING" && (
                  <motion.p 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="text-body-sm text-on-surface-variant mt-1"
                  >
                    Est. {prepTimeLeft} min remaining...
                  </motion.p>
                )}
                {isCurrent && step.id === "READY" && (
                  <motion.p 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="text-body-sm text-on-surface-variant mt-1"
                  >
                    Please pick up your order!
                  </motion.p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
