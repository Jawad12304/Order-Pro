"use client";

import React, { useState } from "react";
import { useCart } from "@/context/CartContext";
import { Trash2, Plus, Minus, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";

export default function CartPage() {
  const { state, dispatch, subtotal, taxRate, taxAmount, totalAmount } = useCart();
  const router = useRouter();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [errorToast, setErrorToast] = useState("");

  const placeOrderMutation = useMutation({
    mutationFn: async () => {
      // Create payload matching schema requirements
      const payload = {
        restaurantId: state.restaurantId || "placeholder-restaurant-id", // Should be fetched from context/layout
        tableId: state.tableNumber ? `table-${state.tableNumber}` : null, // Mapped locally
        customerName: customerName,
        notes: `Phone: ${customerPhone}\n\n${orderNotes}`.trim(),
        subtotalAmount: subtotal,
        taxAmount: taxAmount,
        totalAmount: totalAmount,
        items: state.items.map(item => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          unitPrice: item.basePrice + item.modifiers.reduce((sum, mod) => sum + mod.priceDelta, 0),
          modifiersJson: item.modifiers,
          specialInstructions: item.specialInstructions
        }))
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Failed to place order");
      }

      return res.json();
    },
    onSuccess: (data) => {
      dispatch({ type: "CLEAR_CART" });
      router.push(`/order/${data.orderId}`);
    },
    onError: (err) => {
      setErrorToast("Something went wrong. Please try again.");
      setTimeout(() => setErrorToast(""), 3000);
    }
  });

  const handleCheckout = () => {
    if (!customerName.trim()) {
      setErrorToast("Please enter your name.");
      setTimeout(() => setErrorToast(""), 3000);
      return;
    }
    placeOrderMutation.mutate();
  };

  return (
    <div className="px-margin-mobile pt-8 pb-32">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/menu" className="p-2 bg-surface-container-high rounded-full">
          <ArrowLeft size={20} className="text-on-surface" />
        </Link>
        <h1 className="text-headline-xl font-headline-xl text-on-surface">Your Cart</h1>
      </div>

      {state.items.length === 0 ? (
        <div className="text-center py-20 text-on-surface-variant">
          <p>Your cart is empty.</p>
          <Link href="/menu" className="text-primary mt-4 inline-block font-bold">Return to Menu</Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Items List */}
          {state.items.map((item) => (
            <div key={item.id} className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant/20 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-title-md text-title-md text-on-surface">{item.name}</h3>
                  <p className="text-body-sm text-on-surface-variant">${item.basePrice.toFixed(2)}</p>
                  
                  {item.modifiers.length > 0 && (
                    <ul className="mt-1">
                      {item.modifiers.map(mod => (
                        <li key={mod.modifierId} className="text-xs text-on-surface-variant flex gap-1">
                          <span>+ {mod.name}</span>
                          {mod.priceDelta > 0 && <span>(${mod.priceDelta.toFixed(2)})</span>}
                        </li>
                      ))}
                    </ul>
                  )}

                  {item.specialInstructions && (
                    <p className="text-xs text-on-surface-variant mt-1 italic">"{item.specialInstructions}"</p>
                  )}
                </div>
                <button 
                  onClick={() => dispatch({ type: "REMOVE_ITEM", payload: { id: item.id } })}
                  className="text-error p-1 bg-error-container rounded"
                  disabled={placeOrderMutation.isPending}
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center bg-surface-container-high rounded-full px-2 py-1">
                  <button disabled={placeOrderMutation.isPending} onClick={() => dispatch({ type: "UPDATE_QUANTITY", payload: { id: item.id, quantity: item.quantity - 1 }})} className="p-1 text-primary"><Minus size={16}/></button>
                  <span className="text-body-sm font-bold w-6 text-center">{item.quantity}</span>
                  <button disabled={placeOrderMutation.isPending} onClick={() => dispatch({ type: "UPDATE_QUANTITY", payload: { id: item.id, quantity: item.quantity + 1 }})} className="p-1 text-primary"><Plus size={16}/></button>
                </div>
                <p className="font-title-md text-primary">
                  ${((item.basePrice + item.modifiers.reduce((s, m) => s + m.priceDelta, 0)) * item.quantity).toFixed(2)}
                </p>
              </div>
            </div>
          ))}

          {/* Customer Form */}
          <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 space-y-4">
            <h3 className="font-title-md text-on-surface">Customer Details</h3>
            
            <div>
              <label className="text-label-caps text-on-surface-variant mb-1 block">Name (Required)</label>
              <input 
                type="text" 
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-lg p-3 text-body-sm text-on-surface focus:ring-2 focus:ring-primary outline-none"
                placeholder="John Doe"
                disabled={placeOrderMutation.isPending}
              />
            </div>
            
            <div>
              <label className="text-label-caps text-on-surface-variant mb-1 block">Phone Number (Optional)</label>
              <input 
                type="tel" 
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-lg p-3 text-body-sm text-on-surface focus:ring-2 focus:ring-primary outline-none"
                placeholder="+1 234 567 890"
                disabled={placeOrderMutation.isPending}
              />
            </div>
            
            <div>
              <label className="text-label-caps text-on-surface-variant mb-1 block">Order Notes (Optional)</label>
              <textarea 
                value={orderNotes}
                onChange={e => setOrderNotes(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-lg p-3 text-body-sm text-on-surface focus:ring-2 focus:ring-primary outline-none resize-none h-20"
                placeholder="Any allergies or general requests?"
                disabled={placeOrderMutation.isPending}
              />
            </div>
          </div>

          <div className="my-8 border-t border-outline-variant/30 pt-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-on-surface-variant text-body-lg">Subtotal</span>
              <span className="text-on-surface font-title-md">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mb-6">
              <span className="text-on-surface-variant text-body-lg">Tax ({(taxRate * 100).toFixed(1)}%)</span>
              <span className="text-on-surface font-title-md">${taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-on-surface text-headline-lg-mobile font-headline-lg-mobile">Total</span>
              <span className="text-primary text-headline-lg-mobile font-headline-lg-mobile">${totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {errorToast && (
            <div className="bg-error-container text-on-error-container p-3 rounded-lg text-body-sm text-center font-semibold">
              {errorToast}
            </div>
          )}

          <button 
            onClick={handleCheckout}
            disabled={placeOrderMutation.isPending}
            className="w-full bg-primary text-on-primary font-label-caps text-label-caps py-4 rounded-xl shadow-md active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-70 disabled:active:scale-100"
          >
            {placeOrderMutation.isPending ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                PLACING ORDER...
              </>
            ) : (
              "PLACE ORDER"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
