# Order Pro - Implementation & Fix Roadmap

## ✅ Build Status: PASSING

All packages compile successfully:

- ✓ @order-pro/shared
- ✓ @order-pro/database
- ✓ api
- ✓ kitchen
- ✓ web

---

## 🔧 FIXES APPLIED

### 1. Sentry Next.js Configuration (FIXED)

**File:** [apps/web/next.config.ts](apps/web/next.config.ts)

**Problem:** `withSentryConfig()` was receiving 3 arguments instead of 2

**Solution:** Combined Sentry options into single config object

```typescript
export default withSentryConfig(withPWA(nextConfig), {
  silent: true,
  org: "order-pro",
  project: "order-pro-web",
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
});
```

**Status:** ✅ Build passes

---

## 🚨 CRITICAL ISSUES REQUIRING IMMEDIATE ATTENTION

### SECURITY TIER 1

#### 1. CORS Origin Too Permissive

**File:** [apps/api/src/index.ts](apps/api/src/index.ts) - Line 14
**Risk Level:** CRITICAL
**Impact:** CSRF attacks, cross-origin data theft

**Current Code:**

```typescript
const io = new Server(server, {
  cors: {
    origin: "*", // ❌ DANGEROUS
    methods: ["GET", "POST"],
  },
});
```

**Fix Required:**

```typescript
const io = new Server(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true,
    allowEIO3: true,
  },
});
```

**Action:** Update immediately before production deployment

---

#### 2. JWT Secret Not Validated

**File:** [apps/api/src/middleware/auth.ts](apps/api/src/middleware/auth.ts)
**Risk Level:** HIGH
**Impact:** Unable to verify token authenticity

**Issue:** No check for `process.env.JWT_SECRET` existence

**Fix Required:**

```typescript
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable not set");
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { restaurantId: string };
    req.user = { ...decoded, authUserId: decoded.restaurantId };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};
```

---

#### 3. Missing Input Validation on Endpoints

**Files:** Multiple API routes
**Risk Level:** HIGH
**Impact:** SQL injection, malformed data corruption

**Files needing Zod validation:**

- [ ] [apps/api/src/routes/qr.routes.ts](apps/api/src/routes/qr.routes.ts) - POST /api/qr/bulk-pdf
- [ ] [apps/web/src/app/api/analytics/\*.ts](apps/web/src/app/api/analytics/) - All analytics endpoints
- [ ] [apps/web/src/app/api/orders/[id]/route.ts](apps/web/src/app/api/orders/) - PATCH /api/orders/:id
- [ ] [apps/web/src/app/api/waiter-call/route.ts](apps/web/src/app/api/waiter-call/route.ts)

**Example Fix (Waiter Call):**

```typescript
import { z } from "zod";

const waiterCallSchema = z.object({
  tableId: z.string().min(1, "Table ID required"),
  restaurantId: z.string().min(1, "Restaurant ID required"),
  notes: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tableId, restaurantId } = waiterCallSchema.parse(body);

    // Process waiter call...
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
```

---

### DATABASE TIER 1

#### 4. Missing Inventory Schema

**File:** [packages/database/prisma/schema.prisma](packages/database/prisma/schema.prisma)
**Issue:** Blueprint Step 15 requires inventory management but schema is incomplete

**Add to schema:**

```prisma
model Ingredient {
  id               String   @id @default(cuid())
  restaurantId     String
  restaurant       Restaurant @relation(fields: [restaurantId], references: [id])
  name             String
  unit             String   // kg, liters, pieces, etc.
  currentStock     Float
  minStockAlert    Float
  costPerUnit      Float
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  recipeItems      RecipeItem[]
  stockLogs        StockLog[]

  @@unique([restaurantId, name])
  @@index([restaurantId])
}

model RecipeItem {
  id           String   @id @default(cuid())
  menuItemId   String
  menuItem     MenuItem @relation(fields: [menuItemId], references: [id])
  ingredientId String
  ingredient   Ingredient @relation(fields: [ingredientId], references: [id])
  quantityUsed Float

  @@unique([menuItemId, ingredientId])
}

model StockLog {
  id           String   @id @default(cuid())
  ingredientId String
  ingredient   Ingredient @relation(fields: [ingredientId], references: [id])
  changeAmount Float
  reason       String   // "sale", "waste", "restock"
  createdAt    DateTime @default(now())

  @@index([ingredientId])
}
```

---

#### 5. Missing Order Type Field

**File:** [packages/database/prisma/schema.prisma](packages/database/prisma/schema.prisma) - Order model
**Issue:** Blueprint requires `order_type` for dine-in/takeaway/delivery

**Add to Order model:**

```prisma
enum OrderType {
  DINE_IN
  TAKEAWAY
  DELIVERY
}

model Order {
  // ... existing fields ...
  orderType      OrderType @default(DINE_IN)
  deliveryAddress Json?    // { street, city, lat, lng }
  pickupTime     DateTime?
  deliveryTime   DateTime?
  // ... rest of model ...
}
```

**Action:** Run migrations after schema update

---

### API TIER 1

#### 6. Incomplete Order Endpoint

**File:** [apps/api/src/app.ts](apps/api/src/app.ts) - Line 62
**Issue:** POST /api/orders only validates, doesn't create actual database record

**Current Code (Mock):**

```typescript
app.post("/api/orders", async (req, res) => {
  try {
    const validatedData = orderSchema.parse(req.body);
    console.log("[API] Order validated successfully via Zod", validatedData);
    res.status(201).json({ success: true, order: validatedData }); // ❌ No DB write!
  } catch (error) {
    // ...
  }
});
```

**Required Fix:**

```typescript
app.post("/api/orders", requireAuth, async (req, res) => {
  try {
    const validatedData = orderSchema.parse(req.body);

    // Create order in database
    const order = await prisma.order.create({
      data: {
        restaurantId: req.user.restaurantId,
        tableId: validatedData.tableId,
        customerName: validatedData.customerName,
        status: "PENDING",
        subtotalAmount: calculateSubtotal(validatedData.items),
        taxAmount: calculateTax(calculateSubtotal(validatedData.items)),
        totalAmount: calculateTotal(validatedData.items),
        items: {
          create: validatedData.items.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            unitPrice: await getMenuItemPrice(item.menuItemId),
          })),
        },
      },
      include: { items: true },
    });

    // Emit socket event to kitchen
    io.to(`restaurant_${req.user.restaurantId}`).emit("new-order", order);

    // Send notifications
    await notificationService.notifyNewOrder(order);

    return res.status(201).json({ success: true, orderId: order.id, order });
  } catch (error: any) {
    console.error("Order creation failed:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input", details: error.errors });
    }
    return res.status(500).json({ error: "Internal Server Error" });
  }
});
```

---

#### 7. Missing GET /api/orders/:id Endpoint

**Issue:** Blueprint requires order status endpoint for customer tracking
**Status:** NOT IMPLEMENTED

**Required Implementation:**

```typescript
// Add to apps/api/src/app.ts
app.get("/api/orders/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
        table: true,
        payments: true,
      },
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Verify tenant access
    if (order.restaurantId !== req.user.restaurantId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    return res.status(200).json(order);
  } catch (error) {
    console.error("Order fetch failed:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});
```

---

### FRONTEND TIER 1

#### 8. Cart Context Not Implemented

**File:** [apps/web/src/context/CartContext.tsx](apps/web/src/context/CartContext.tsx)
**Issue:** Cart management required for order flow but context is incomplete

**Status:** STRUCTURE EXISTS, LOGIC MISSING

**Required Implementation:**

```typescript
"use client";

import React, { useReducer, useContext, ReactNode } from "react";

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  modifiers?: Array<{
    groupName: string;
    selectedValue: string;
    priceDelta: number;
  }>;
  specialInstructions?: string;
}

interface CartState {
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
}

type CartAction =
  | { type: "ADD_ITEM"; payload: CartItem }
  | { type: "REMOVE_ITEM"; payload: string }
  | { type: "UPDATE_QUANTITY"; payload: { menuItemId: string; quantity: number } }
  | { type: "CLEAR_CART" };

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case "ADD_ITEM": {
      const existingItem = state.items.find(i => i.menuItemId === action.payload.menuItemId);
      if (existingItem) {
        return {
          ...state,
          items: state.items.map(i =>
            i.menuItemId === action.payload.menuItemId
              ? { ...i, quantity: i.quantity + action.payload.quantity }
              : i
          ),
        };
      }
      return { ...state, items: [...state.items, action.payload] };
    }
    case "REMOVE_ITEM":
      return { ...state, items: state.items.filter(i => i.menuItemId !== action.payload) };
    case "UPDATE_QUANTITY":
      return {
        ...state,
        items: state.items.map(i =>
          i.menuItemId === action.payload.menuItemId
            ? { ...i, quantity: action.payload.quantity }
            : i
        ),
      };
    case "CLEAR_CART":
      return { items: [], subtotal: 0, tax: 0, total: 0 };
    default:
      return state;
  }
};

const CartContext = React.createContext<{
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
} | null>(null);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    subtotal: 0,
    tax: 0,
    total: 0,
  });

  return (
    <CartContext.Provider value={{ state, dispatch }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
};
```

---

## 🛠️ IMPLEMENTATION PRIORITY

### Phase 1: Security Hardening (24 hours)

1. [ ] Fix CORS configuration in Socket.io
2. [ ] Validate JWT_SECRET in auth middleware
3. [ ] Add Zod validation to all API endpoints
4. [ ] Add environment variable validation on startup

### Phase 2: Database & API Completion (Week 1)

1. [ ] Add inventory schema to Prisma
2. [ ] Add order_type and delivery fields to Order model
3. [ ] Run migrations
4. [ ] Implement complete POST /api/orders endpoint
5. [ ] Implement GET /api/orders/:id endpoint
6. [ ] Implement PATCH /api/orders/:id endpoint (status updates)

### Phase 3: Frontend Logic (Week 1)

1. [ ] Implement CartContext reducer logic
2. [ ] Implement OrderService for API calls
3. [ ] Implement order creation form
4. [ ] Implement order tracking page with real-time updates

### Phase 4: Analytics & Admin (Week 2)

1. [ ] Implement analytics query endpoints
2. [ ] Build admin dashboard pages
3. [ ] Implement real-time order management

### Phase 5: Testing & QA (Week 2-3)

1. [ ] Write unit tests for all services
2. [ ] Write integration tests for API flows
3. [ ] Write E2E tests for customer journey
4. [ ] Performance testing and optimization

---

## 📋 FILES REQUIRING EDITS

### High Priority

- [ ] [apps/api/src/index.ts](apps/api/src/index.ts) - CORS fix
- [ ] [apps/api/src/middleware/auth.ts](apps/api/src/middleware/auth.ts) - JWT validation
- [ ] [apps/api/src/app.ts](apps/api/src/app.ts) - POST /api/orders implementation
- [ ] [packages/database/prisma/schema.prisma](packages/database/prisma/schema.prisma) - Add inventory & order type
- [ ] [apps/web/src/context/CartContext.tsx](apps/web/src/context/CartContext.tsx) - Cart logic

### Medium Priority

- [ ] [apps/api/src/routes/qr.routes.ts](apps/api/src/routes/qr.routes.ts) - Add Zod validation
- [ ] [apps/web/src/app/api/analytics](apps/web/src/app/api/analytics) - All analytics endpoints
- [ ] [apps/web/src/app/api/orders](apps/web/src/app/api/orders) - GET/:id, PATCH/:id
- [ ] [.env.example](.env.example) - Complete environment variables

### Lower Priority

- [ ] Create database seed script
- [ ] Add GitHub Actions workflows
- [ ] Add test suites

---

## 🚀 Next Steps

1. **Complete Security Fixes** (2 hours)
2. **Update Database Schema** (30 minutes)
3. **Implement Core API Endpoints** (4 hours)
4. **Build Frontend Cart & Order Flow** (6 hours)
5. **Test End-to-End** (2 hours)
6. **Document & Deploy** (1 hour)

---

**Total Estimated Time to MVP:** 3-4 days of focused development

Generated: 2026-06-06
