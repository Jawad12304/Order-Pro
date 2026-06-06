import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: "*", // Adjust this in production
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true
}));
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

import { requireAuth, requireTenant, requireRole } from "./middleware/auth";

// Health Check Route
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
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

export default app;
