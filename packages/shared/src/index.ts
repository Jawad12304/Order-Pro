import { z } from "zod";

// ==========================================
// 1. Enums (mirroring Prisma enums)
// ==========================================

export const SubscriptionPlanEnum = z.enum([
  "FREE",
  "STARTER",
  "PRO",
  "ENTERPRISE",
]);
export type SubscriptionPlan = z.infer<typeof SubscriptionPlanEnum>;

export const TableStatusEnum = z.enum([
  "AVAILABLE",
  "OCCUPIED",
  "RESERVED",
]);
export type TableStatus = z.infer<typeof TableStatusEnum>;

export const SessionStatusEnum = z.enum([
  "ACTIVE",
  "COMPLETED",
  "ABANDONED",
]);
export type SessionStatus = z.infer<typeof SessionStatusEnum>;

export const OrderStatusEnum = z.enum([
  "PENDING",      // Order placed, awaiting confirmation
  "CONFIRMED",    // Order accepted by staff/kitchen
  "PREPARING",    // Actively being cooked
  "READY",        // Food is ready for pickup/delivery to table
  "SERVED",       // Food delivered to customer
  "PAID",         // Payment received, order complete
  "CANCELLED",    // Order aborted
]);
export type OrderStatus = z.infer<typeof OrderStatusEnum>;

export const PaymentStatusEnum = z.enum([
  "PENDING",
  "COMPLETED",
  "FAILED",
  "REFUNDED",
]);
export type PaymentStatus = z.infer<typeof PaymentStatusEnum>;

export const PaymentMethodEnum = z.enum([
  "CASH",
  "CARD",
  "MOBILE",
  "OTHER",
]);
export type PaymentMethod = z.infer<typeof PaymentMethodEnum>;

export const StaffRoleEnum = z.enum([
  "OWNER",
  "MANAGER",
  "WAITER",
  "CHEF",
]);
export type StaffRole = z.infer<typeof StaffRoleEnum>;

// ==========================================
// 2. Restaurant Schema
// ==========================================

export const RestaurantSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  logoUrl: z.string().url().optional().nullable(),
  themeColor: z.string().default("#F97316"),
  currency: z.string().default("USD"),
  settingsJson: z.any().optional().nullable(),
  subscriptionPlan: SubscriptionPlanEnum.default("FREE"),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Restaurant = z.infer<typeof RestaurantSchema>;

// ==========================================
// 3. Table Schema
// ==========================================

export const TableSchema = z.object({
  id: z.string(),
  restaurantId: z.string(),
  number: z.number().int().positive(),
  qrCodeUrl: z.string().optional().nullable(),
  status: TableStatusEnum.default("AVAILABLE"),
  capacity: z.number().int().positive().default(4),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Table = z.infer<typeof TableSchema>;

// ==========================================
// 4. Category Schema
// ==========================================

export const CategorySchema = z.object({
  id: z.string(),
  restaurantId: z.string(),
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  sortOrder: z.number().int().default(0),
  isVisible: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Category = z.infer<typeof CategorySchema>;

// ==========================================
// 5. Menu Item Schema
// ==========================================

export const MenuItemSchema = z.object({
  id: z.string(),
  restaurantId: z.string(),
  categoryId: z.string(),
  name: z.string().min(1, "Item name is required"),
  description: z.string().optional().nullable(),
  price: z.number().positive("Price must be greater than 0"),
  imageUrl: z.string().url().optional().nullable(),
  isAvailable: z.boolean().default(true),
  prepTimeMins: z.number().int().positive().optional().nullable(),
  allergens: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  sortOrder: z.number().int().default(0),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type MenuItem = z.infer<typeof MenuItemSchema>;

// ==========================================
// 6. Modifier Group & Modifier Schemas
// ==========================================

export const ModifierGroupSchema = z.object({
  id: z.string(),
  restaurantId: z.string(),
  name: z.string().min(1, "Modifier group name is required"),
  isRequired: z.boolean().default(false),
  minSelections: z.number().int().min(0).default(0),
  maxSelections: z.number().int().min(1).default(1),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type ModifierGroup = z.infer<typeof ModifierGroupSchema>;

export const ModifierSchema = z.object({
  id: z.string(),
  modifierGroupId: z.string(),
  name: z.string().min(1, "Modifier name is required"),
  priceDelta: z.number().default(0),
  isDefault: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Modifier = z.infer<typeof ModifierSchema>;

// ==========================================
// 7. Table Session Schema
// ==========================================

export const TableSessionSchema = z.object({
  id: z.string(),
  restaurantId: z.string(),
  tableId: z.string(),
  status: SessionStatusEnum.default("ACTIVE"),
  guestCount: z.number().int().positive().optional().nullable(),
  startedAt: z.date(),
  endedAt: z.date().optional().nullable(),
});
export type TableSession = z.infer<typeof TableSessionSchema>;

// ==========================================
// 8. Order Item Schema
// ==========================================

export const OrderItemSchema = z.object({
  id: z.string().optional(),
  orderId: z.string().optional(),
  menuItemId: z.string(),
  name: z.string(), // Denormalized for display convenience
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  unitPrice: z.number().nonnegative(),
  modifiersJson: z.any().optional().nullable(), // JSON snapshot of selected modifiers
  specialInstructions: z.string().optional().nullable(),
});
export type OrderItem = z.infer<typeof OrderItemSchema>;

// ==========================================
// 9. Order Schema
// ==========================================

export const OrderSchema = z.object({
  id: z.string(),
  restaurantId: z.string(),
  tableId: z.string().optional().nullable(),
  tableSessionId: z.string().optional().nullable(),
  customerName: z.string().optional().nullable(),
  status: OrderStatusEnum.default("PENDING"),
  subtotalAmount: z.number().nonnegative().default(0),
  taxAmount: z.number().nonnegative().default(0),
  totalAmount: z.number().nonnegative().default(0),
  notes: z.string().optional().nullable(),
  items: z.array(OrderItemSchema).min(1, "Order must have at least one item"),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Order = z.infer<typeof OrderSchema>;

// ==========================================
// 10. Payment Schema
// ==========================================

export const PaymentSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  method: PaymentMethodEnum.default("CASH"),
  amount: z.number().positive("Amount must be greater than 0"),
  gatewayRef: z.string().optional().nullable(),
  status: PaymentStatusEnum.default("PENDING"),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Payment = z.infer<typeof PaymentSchema>;

// ==========================================
// 11. Staff Schema
// ==========================================

export const StaffSchema = z.object({
  id: z.string(),
  restaurantId: z.string(),
  name: z.string().min(1, "Staff name is required"),
  email: z.string().email().optional().nullable(),
  role: StaffRoleEnum.default("WAITER"),
  pin: z.string().min(4).max(6).optional().nullable(),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Staff = z.infer<typeof StaffSchema>;

// ==========================================
// 12. Utility Functions
// ==========================================

export const formatCurrency = (amount: number, currency: string = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount);
};

/**
 * Generate a URL-safe slug from a restaurant name.
 */
export const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
};
