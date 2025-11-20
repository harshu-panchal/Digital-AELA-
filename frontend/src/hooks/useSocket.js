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
  const connectionAttemptRef = useRef(null);
  const lastTokenRef = useRef(null);

  useEffect(() => {
    // Clear any pending connection attempts
    if (connectionAttemptRef.current) {
      clearTimeout(connectionAttemptRef.current);
      connectionAttemptRef.current = null;
    }

    if (!tokens?.accessToken) {
      // Disconnect if no token
      if (socketRef.current) {
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
      lastTokenRef.current = null;
      return;
    }

    // Prevent duplicate connections with the same token
    if (lastTokenRef.current === tokens.accessToken && socketRef.current?.connected) {
      return;
    }

    // Debounce connection attempts to prevent rapid reconnections
    connectionAttemptRef.current = setTimeout(() => {
      // Check if token changed during debounce
      if (lastTokenRef.current === tokens.accessToken && socketRef.current?.connected) {
        return;
      }

      // Clean up existing socket before creating a new one
      if (socketRef.current) {
        try {
          socketRef.current.removeAllListeners();
          socketRef.current.disconnect();
        } catch (e) {
          // Ignore errors during cleanup
        }
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
        reconnectionAttempts: 5,
        reconnectionDelayMax: 10000,
        timeout: 10000,
        autoConnect: true,
        // Suppress default error logging
        forceNew: false,
      });

      // Suppress WebSocket connection errors in console
      const originalEmit = newSocket.emit;
      newSocket.emit = function(...args) {
        try {
          return originalEmit.apply(this, args);
        } catch (e) {
          // Silently ignore emit errors during connection
          return false;
        }
      };

      newSocket.on("connect", () => {
        // eslint-disable-next-line no-console
        console.log("[Socket.IO] Connected");
        setIsConnected(true);
        lastTokenRef.current = tokens.accessToken;
      });

      newSocket.on("disconnect", (reason) => {
        setIsConnected(false);
        // Only log disconnects if they're not expected
        if (reason !== "io server disconnect" && reason !== "transport close" && reason !== "transport error") {
          // Only log in development
          if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.log("[Socket.IO] Disconnected:", reason);
          }
        }
      });

      newSocket.on("connect_error", (error) => {
        setIsConnected(false);
        // Suppress all WebSocket and connection errors
        const shouldSuppress = 
          error.message?.includes("xhr poll error") ||
          error.message?.includes("websocket error") ||
          error.message?.includes("WebSocket") ||
          error.message?.includes("TransportError") ||
          error.type === "TransportError" ||
          error.message?.includes("Connection refused") ||
          error.message?.includes("closed before the connection is established") ||
          error.message?.includes("timeout") ||
          error.message?.includes("NetworkError");
        
        // Only log authentication errors in development
        if (!shouldSuppress && error.message?.includes("Authentication error") && import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.warn("[Socket.IO] Authentication error:", error.message);
        }
        // Silent fail for all other connection errors
      });

      socketRef.current = newSocket;
      setSocket(newSocket);
    }, 300); // 300ms debounce to prevent rapid reconnections

    return () => {
      if (connectionAttemptRef.current) {
        clearTimeout(connectionAttemptRef.current);
        connectionAttemptRef.current = null;
      }
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

