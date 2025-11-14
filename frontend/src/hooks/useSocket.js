import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../contexts/AuthContext";

// Socket.io connects to the base server URL (without /api/v1)
const SOCKET_URL =
  import.meta.env.VITE_API_URL?.replace(/\/api\/v1\/?$/, "") ||
  "http://localhost:5000";

export const useSocket = () => {
  const { tokens } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!tokens?.accessToken) {
      // Disconnect if no token
      if (socketRef.current) {
        socketRef.current.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Initialize socket connection
    const newSocket = io(SOCKET_URL, {
      auth: {
        token: tokens.accessToken,
      },
      transports: ["websocket", "polling"],
    });

    newSocket.on("connect", () => {
      // eslint-disable-next-line no-console
      console.log("[Socket.IO] Connected");
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      // eslint-disable-next-line no-console
      console.log("[Socket.IO] Disconnected");
      setIsConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      // eslint-disable-next-line no-console
      console.error("[Socket.IO] Connection error:", error);
      setIsConnected(false);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      newSocket.close();
      socketRef.current = null;
    };
  }, [tokens?.accessToken]);

  return { socket, isConnected };
};

