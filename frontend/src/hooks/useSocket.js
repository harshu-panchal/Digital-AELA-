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
        socketRef.current.removeAllListeners();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Clean up existing socket before creating a new one
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current.removeAllListeners();
      socketRef.current = null;
    }

    // Initialize socket connection
    const newSocket = io(SOCKET_URL, {
      auth: {
        token: tokens.accessToken,
      },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
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
      // Don't log authentication errors as they're expected during initial connection
      if (error.message?.includes("Authentication error")) {
        // Silent fail - will retry when token is available
        return;
      }
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current.removeAllListeners();
        socketRef.current = null;
      }
      setSocket(null);
      setIsConnected(false);
    };
  }, [tokens?.accessToken]);

  return { socket, isConnected };
};

