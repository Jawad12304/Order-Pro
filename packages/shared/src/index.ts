import { z } from "zod";

// ==========================================
// 1. Restaurant / Tenant Schemas & Types
// ==========================================
export const RestaurantSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  logoUrl: z.string().url().optional(),
  currency: z.string().default("USD"),
  createdAt: z.date(),
});

export type Restaurant = z.infer<typeof RestaurantSchema>;

// ==========================================
// 2. Menu / Product Schemas & Types
// ==========================================
export const ProductSchema = z.object({
  id: z.string(),
  restaurantId: z.string(),
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  price: z.number().positive("Price must be greater than 0"),
  imageUrl: z.string().url().optional(),
  category: z.string(),
  inStock: z.boolean().default(true),
});

export type Product = z.infer<typeof ProductSchema>;

// ==========================================
// 3. Order Item & Order Schemas & Types
// ==========================================
export const OrderItemSchema = z.object({
  productId: z.string(),
  name: z.string(),
  price: z.number(),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  notes: z.string().optional(),
});

export type OrderItem = z.infer<typeof OrderItemSchema>;

export const OrderStatusEnum = z.enum([
  "PENDING",      // Order placed, waiting for payment/acceptance
  "PROCESSING",   // Cooking in kitchen
  "READY",        // Food is ready for pickup/delivery to table
  "COMPLETED",    // Food delivered, checkout complete
  "CANCELLED",    // Order aborted
]);

export type OrderStatus = z.infer<typeof OrderStatusEnum>;

export const OrderSchema = z.object({
  id: z.string(),
  restaurantId: z.string(),
  tableId: z.string(),
  status: OrderStatusEnum.default("PENDING"),
  items: z.array(OrderItemSchema).min(1, "Order must have at least one item"),
  totalAmount: z.number().nonnegative(),
  customerName: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Order = z.infer<typeof OrderSchema>;

// ==========================================
// 4. Utility Functions
// ==========================================
export const formatCurrency = (amount: number, currency: string = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount);
};
