"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Connect to the Express/Socket.io backend
    const defaultApiUrl = typeof window !== "undefined" && window.location.hostname !== "localhost"
      ? "https://orderpro-api.up.railway.app/api"
      : "http://localhost:3001/api";
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || defaultApiUrl;
    const socketUrl = apiUrl.replace(/\/api\/?$/, "");
    const socketInstance = io(socketUrl, {
      autoConnect: true,
      transports: ["websocket"],
    });

    socketInstance.on("connect", () => {
      console.log("[Socket] Connected to server");
      setIsConnected(true);
    });

    socketInstance.on("disconnect", () => {
      console.log("[Socket] Disconnected from server");
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
