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
    let socketUrl = "";
    if (process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.startsWith("/")) {
      socketUrl = process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, "");
    } else if (typeof window !== "undefined") {
      socketUrl = window.location.origin;
    } else {
      socketUrl = "http://localhost:5000";
    }
    const socketInstance = io(socketUrl, {
      autoConnect: true,
      transports: ["websocket"],
    });

    socketInstance.on("connect", () => {
      console.log("[Kitchen Socket] Connected to server");
      setIsConnected(true);
    });

    socketInstance.on("disconnect", () => {
      console.log("[Kitchen Socket] Disconnected from server");
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
