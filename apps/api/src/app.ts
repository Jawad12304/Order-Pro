import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";

const app = express();

// --- SECURITY & PERFORMANCE MIDDLEWARE ---

// 1. Helmet (Security Headers)
app.use(helmet());

// 2. CORS (Allowlist)
const allowlist = ["http://localhost:3000", "https://orderpro.app", "https://*.orderpro.app"];
const corsOptionsDelegate = function (req: any, callback: any) {
  let corsOptions;
  if (allowlist.indexOf(req.header("Origin")) !== -1) {
    corsOptions = { origin: true, credentials: true };
  } else {
    corsOptions = { origin: false };
  }
  callback(null, corsOptions);
};
app.use(cors(corsOptionsDelegate));

// 3. Compression (Payload reduction)
app.use(compression());

// 4. Rate Limiting (100 req/min per IP)
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per `window`
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests from this IP, please try again after a minute" }
});
// Apply to all requests
app.use(limiter);

// --- BODY PARSERS ---
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

import { requireAuth, requireTenant, requireRole } from "./middleware/auth";
import qrRoutes from "./routes/qr.routes";
import { z } from "zod";

// Zod schema for order validation
const orderSchema = z.object({
  restaurantId: z.string().min(1),
  tableId: z.string().min(1),
  items: z.array(z.object({
    menuItemId: z.string(),
    quantity: z.number().int().positive(),
  })).min(1),
  customerName: z.string().optional()
});

// Secure API endpoint with Zod Validation
app.post("/api/orders", async (req, res) => {
  try {
    const validatedData = orderSchema.parse(req.body);
    console.log("[API] Order validated successfully via Zod", validatedData);
    res.status(201).json({ success: true, order: validatedData });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input", details: error.errors });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Health Check Route
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

import { withCache } from "./lib/redis";

// Mock database call
const fetchMenuFromDB = async (slug: string) => {
  console.log(`[DB] Fetching menu for ${slug} from database...`);
  // Delay to simulate DB
  await new Promise(resolve => setTimeout(resolve, 500));
  return { slug, categories: [], items: [] };
};

// Cached Menu Route
app.get("/api/menu/:slug", async (req, res) => {
  const { slug } = req.params;
  try {
    // Cache for 5 minutes (300 seconds)
    const menu = await withCache(`menu:${slug}`, 300, () => fetchMenuFromDB(slug));
    res.status(200).json({ success: true, data: menu });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch menu" });
  }
});

// Protected Multi-Tenant Route Example
// Try accessing via http://pizza-palace.localhost:3001/api/dashboard
app.get(
  "/api/dashboard",
  requireAuth,
  requireTenant,
  requireRole(["OWNER", "MANAGER"]), // Only owners and managers can access this
  (req, res) => {
    res.status(200).json({
      message: `Welcome to ${req.restaurant?.slug}'s dashboard!`,
      user: req.user, // Role, authUserId, etc.
    });
  }
);

// Mount QR Routes
app.use("/api/qr", qrRoutes);

export default app;
