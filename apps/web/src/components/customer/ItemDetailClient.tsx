"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronLeft, Plus, Minus } from "lucide-react";
import { useCart } from "@/context/CartContext";

export default function ItemDetailClient({ item }: { item: any }) {
  const router = useRouter();
  const { dispatch } = useCart();
  
  const [quantity, setQuantity] = useState(1);
  const [instructions, setInstructions] = useState("");

  const handleAddToCart = () => {
    dispatch({
      type: "ADD_ITEM",
      payload: {
        id: `${item.id}-${Date.now()}`,
        menuItemId: item.id,
        name: item.name,
        basePrice: item.price,
        quantity,
        modifiers: [],
        specialInstructions: instructions,
      }
    });
    router.back();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-on-background/50 backdrop-blur-sm flex items-end sm:items-center sm:justify-center">
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="bg-background w-full h-[85vh] sm:h-auto sm:max-h-[85vh] sm:w-[500px] sm:rounded-2xl rounded-t-3xl shadow-2xl flex flex-col overflow-hidden"
      >
        <div className="relative h-64 flex-shrink-0 bg-surface-container-high">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-on-surface-variant">No Image</div>
          )}
          <button 
            onClick={() => router.back()}
            className="absolute top-4 left-4 bg-surface/80 backdrop-blur p-2 rounded-full text-on-surface"
          >
            <ChevronLeft />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-grow hide-scrollbar">
          <div className="flex justify-between items-start mb-2">
            <h2 className="text-headline-lg-mobile font-headline-lg-mobile text-on-surface">{item.name}</h2>
            <span className="text-price-display font-price-display text-primary">${item.price.toFixed(2)}</span>
          </div>
          {item.description && (
            <p className="text-body-sm text-on-surface-variant mb-6">{item.description}</p>
          )}

          <hr className="border-outline-variant/30 my-6" />

          {/* Special Instructions */}
          <div className="mb-6">
            <h3 className="text-title-md font-title-md text-on-surface mb-2">Special Instructions</h3>
            <textarea 
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="E.g. no onions, extra sauce..."
              className="w-full bg-surface-container-low border border-outline-variant/50 rounded-xl p-3 text-body-sm text-on-surface focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none h-24"
            />
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="p-4 bg-surface border-t border-outline-variant/30 flex items-center gap-4">
          <div className="flex items-center bg-surface-container-high rounded-full px-2 py-1">
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 text-primary active:scale-90 transition-transform"><Minus size={20}/></button>
            <span className="text-title-md font-title-md w-8 text-center">{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)} className="p-2 text-primary active:scale-90 transition-transform"><Plus size={20}/></button>
          </div>
          
          <button 
            onClick={handleAddToCart}
            className="flex-grow bg-primary text-on-primary font-label-caps text-label-caps py-4 rounded-xl shadow-md active:scale-95 transition-transform"
          >
            ADD ${(item.price * quantity).toFixed(2)}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
