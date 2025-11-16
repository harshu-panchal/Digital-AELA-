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

    // Initialize socket connection with quiet error handling
    const newSocket = io(SOCKET_URL, {
      auth: {
        token: tokens.accessToken,
      },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 3,
      timeout: 5000,
      // Suppress automatic error logging
      autoConnect: true,
    });

    newSocket.on("connect", () => {
      // eslint-disable-next-line no-console
      console.log("[Socket.IO] Connected");
      setIsConnected(true);
    });

    newSocket.on("disconnect", (reason) => {
      setIsConnected(false);
      // Only log disconnects if they're not expected (server shutdown, etc.)
      if (reason !== "io server disconnect" && reason !== "transport close") {
        // eslint-disable-next-line no-console
        console.log("[Socket.IO] Disconnected:", reason);
      }
    });

    newSocket.on("connect_error", (error) => {
      setIsConnected(false);
      // Suppress all connection errors when server is not available
      // These are expected when the backend is not running
      const isConnectionRefused = 
        error.message?.includes("xhr poll error") ||
        error.message?.includes("websocket error") ||
        error.message?.includes("TransportError") ||
        error.type === "TransportError" ||
        error.message?.includes("Connection refused");
      
      // Only log non-connection errors (like authentication errors that aren't expected)
      if (!isConnectionRefused && !error.message?.includes("Authentication error")) {
        // Only in development and for unexpected errors
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.warn("[Socket.IO] Connection error:", error.message || error);
        }
      }
      // Silent fail for connection refused - server is not running
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      if (socketRef.current) {
        // Gracefully disconnect without triggering error handlers
        try {
          socketRef.current.removeAllListeners();
          socketRef.current.disconnect();
        } catch (e) {
          // Ignore errors during cleanup
        }
        socketRef.current = null;
      }
      setSocket(null);
      setIsConnected(false);
    };
  }, [tokens?.accessToken]);

  return { socket, isConnected };
};

