import http from "http";
import { Server } from "socket.io";
import app from "./app";
import dotenv from "dotenv";
import { notificationService } from "./services/NotificationService";
import { Request, Response } from "express";

dotenv.config();

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: "*", // Adjust in production
    methods: ["GET", "POST"]
  }
});

// Pass Socket instance to Notification Service
notificationService.setSocketInstance(io);

// Zod route moved to app.ts

// Notification API Routes
app.post("/api/notify/whatsapp", async (req: Request, res: Response) => {
  const { phone, templateName, variables } = req.body;
  if (!phone || !templateName) return res.status(400).json({ error: "Missing phone or templateName" });
  
  await notificationService.sendWhatsAppTemplate(phone, templateName);
  res.json({ success: true, message: "WhatsApp triggered" });
});

app.post("/api/webhooks/whatsapp", (req: Request, res: Response) => {
  console.log("[WhatsApp Webhook] Received status update:", JSON.stringify(req.body, null, 2));
  res.status(200).send("EVENT_RECEIVED");
});

app.get("/api/webhooks/whatsapp", (req: Request, res: Response) => {
  // Verify token for Meta webhook setup
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.status(403).send("Forbidden");
  }
});

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  // Join a specific restaurant room (multi-tenancy)
  socket.on("join-restaurant", (restaurantId: string) => {
    socket.join(`restaurant_${restaurantId}`);
    socket.join(`kitchen_${restaurantId}`);
    socket.join(`staff_${restaurantId}`);
    console.log(`[Socket] Client ${socket.id} joined restaurant: ${restaurantId}`);
  });

  socket.on("join_order", (orderId: string) => {
    socket.join(`order_${orderId}`);
  });

  // Handle new orders placed by customers
  socket.on("new-order", (data: { restaurantId: string; orderId: string; tableId: string; items: any[] }) => {
    console.log(`[Socket] New order placed for restaurant ${data.restaurantId}: ${data.orderId}`);
    notificationService.notifyNewOrder(data.restaurantId, data);
  });

  // Handle order status updates (e.g. from kitchen or staff)
  socket.on("update-order-status", (data: { restaurantId: string; orderId: string; status: string }) => {
    console.log(`[Socket] Order status updated for restaurant ${data.restaurantId}: ${data.orderId} -> ${data.status}`);
    if (data.status === "READY") {
      notificationService.notifyOrderReady(data.restaurantId, data, "+1234567890", "customer@example.com");
    } else {
      io.to(`restaurant_${data.restaurantId}`).emit("order-status-updated", data);
    }
  });

  socket.on("disconnect", () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

// Start listening
server.listen(PORT, () => {
  console.log(`=============================================`);
  console.log(`🚀 Order-Pro Server running on port ${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`=============================================`);
});
