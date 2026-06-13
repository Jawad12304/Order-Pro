"use client";

import React, { createContext, useReducer, useEffect, useContext } from "react";

export type CartItem = {
  id: string; // unique ID for the cart entry (could be a hash of menuItemId + modifiers)
  menuItemId: string;
  name: string;
  basePrice: number;
  quantity: number;
  modifiers: {
    groupId: string;
    modifierId: string;
    name: string;
    priceDelta: number;
  }[];
  specialInstructions?: string;
};

type CartState = {
  items: CartItem[];
  tableNumber: number | null;
  restaurantId: string | null;
  tablesMap: Record<number, string>; // tableNumber -> tableId (CUID)
  isHydrated: boolean; // True after first load from localStorage
};

type CartAction =
  | { type: "ADD_ITEM"; payload: CartItem }
  | { type: "REMOVE_ITEM"; payload: { id: string } }
  | { type: "UPDATE_QUANTITY"; payload: { id: string; quantity: number } }
  | { type: "CLEAR_CART" }
  | { type: "HYDRATE"; payload: CartState }
  | { type: "SET_META"; payload: { tableNumber?: number; restaurantId: string; tablesMap?: Record<number, string> } };

const initialState: CartState = {
  items: [],
  tableNumber: null,
  restaurantId: null,
  tablesMap: {},
  isHydrated: false,
};

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      // Check if exact item already exists
      const existingItemIndex = state.items.findIndex((item) => item.id === action.payload.id);
      if (existingItemIndex >= 0) {
        const newItems = [...state.items];
        newItems[existingItemIndex].quantity += action.payload.quantity;
        return { ...state, items: newItems };
      }
      return { ...state, items: [...state.items, action.payload] };
    }
    case "REMOVE_ITEM":
      return { ...state, items: state.items.filter((item) => item.id !== action.payload.id) };
    case "UPDATE_QUANTITY": {
      if (action.payload.quantity <= 0) {
        return { ...state, items: state.items.filter((item) => item.id !== action.payload.id) };
      }
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.payload.id ? { ...item, quantity: action.payload.quantity } : item
        ),
      };
    }
    case "CLEAR_CART":
      return { ...state, items: [] };
    case "HYDRATE":
      return { ...action.payload, isHydrated: true };
    case "SET_META":
      return {
        ...state,
        tableNumber: action.payload.tableNumber ?? state.tableNumber,
        restaurantId: action.payload.restaurantId,
        tablesMap: action.payload.tablesMap ?? state.tablesMap,
      };
    default:
      return state;
  }
}

const CartContext = createContext<{
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
  totalItems: number;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  /** Resolve a table number to a real CUID from the DB */
  resolveTableId: (tableNumber: number) => string | null;
} | null>(null);

interface CartProviderProps {
  children: React.ReactNode;
  restaurantId?: string | null;
  tablesMap?: Record<number, string>;
}

export function CartProvider({ children, restaurantId, tablesMap }: CartProviderProps) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Hydrate from sessionStorage on mount
  useEffect(() => {
    const saved = sessionStorage.getItem("orderProCart");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        dispatch({ type: "HYDRATE", payload: { ...initialState, ...parsed } });
      } catch (e) {
        console.error("Failed to parse cart from sessionStorage");
        dispatch({ type: "HYDRATE", payload: initialState });
      }
    } else {
      dispatch({ type: "HYDRATE", payload: initialState });
    }
  }, []);

  // Set restaurant metadata from server-rendered props
  useEffect(() => {
    if (restaurantId) {
      dispatch({
        type: "SET_META",
        payload: { restaurantId, tablesMap: tablesMap || {} },
      });
    }
  }, [restaurantId, tablesMap]);

  // Persist to sessionStorage whenever state changes
  useEffect(() => {
    if (state.isHydrated) {
      sessionStorage.setItem("orderProCart", JSON.stringify(state));
    }
  }, [state]);

  const totalItems = state.items.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = state.items.reduce((acc, item) => {
    const itemTotal = item.basePrice + item.modifiers.reduce((sum, mod) => sum + mod.priceDelta, 0);
    return acc + itemTotal * item.quantity;
  }, 0);
  
  const taxRate = 0.08; // Configurable per restaurant
  const taxAmount = subtotal * taxRate;
  const totalAmount = subtotal + taxAmount;

  const resolveTableId = (tableNumber: number): string | null => {
    return state.tablesMap[tableNumber] ?? null;
  };

  return (
    <CartContext.Provider value={{ state, dispatch, totalItems, subtotal, taxRate, taxAmount, totalAmount, resolveTableId }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

