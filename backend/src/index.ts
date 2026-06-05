import http from "http";
import { Server } from "socket.io";
import app from "./app";
import dotenv from "dotenv";

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

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  // Join a specific restaurant room (multi-tenancy)
  socket.on("join-restaurant", (restaurantId: string) => {
    socket.join(`restaurant_${restaurantId}`);
    console.log(`[Socket] Client ${socket.id} joined restaurant: ${restaurantId}`);
  });

  // Handle new orders placed by customers
  socket.on("new-order", (data: { restaurantId: string; orderId: string; tableId: string; items: any[] }) => {
    console.log(`[Socket] New order placed for restaurant ${data.restaurantId}: ${data.orderId}`);
    // Broadcast to kitchen display screen and staff in the same restaurant
    io.to(`restaurant_${data.restaurantId}`).emit("order-received", data);
  });

  // Handle order status updates (e.g. from kitchen or staff)
  socket.on("update-order-status", (data: { restaurantId: string; orderId: string; status: string }) => {
    console.log(`[Socket] Order status updated for restaurant ${data.restaurantId}: ${data.orderId} -> ${data.status}`);
    // Broadcast status change back to customer and staff
    io.to(`restaurant_${data.restaurantId}`).emit("order-status-updated", data);
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
