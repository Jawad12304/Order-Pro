"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/context/CartContext";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";

export default function FloatingCartFab() {
  const { totalItems } = useCart();

  if (totalItems === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="fixed bottom-24 right-margin-mobile z-[60]"
      >
        <Link href="/cart">
          <button className="bg-primary-container text-on-primary-container w-16 h-16 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110 active:scale-95 group relative">
            <ShoppingCart className="w-8 h-8" />
            <motion.span
              key={totalItems}
              initial={{ scale: 1.5, y: -10 }}
              animate={{ scale: 1, y: 0 }}
              className="absolute -top-2 -right-2 bg-primary text-on-primary text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-primary-container"
            >
              {totalItems}
            </motion.span>
          </button>
        </Link>
      </motion.div>
    </AnimatePresence>
  );
}
