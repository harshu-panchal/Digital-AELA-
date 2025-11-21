import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../contexts/AuthContext";
import { clearStoredTokens, notifyAuthUpdate } from "../services/api/baseClient";

// Socket.io connects to the base server URL (without /api/v1)
const SOCKET_URL =
  import.meta.env.VITE_API_URL?.replace(/\/api\/v1\/?$/, "") ||
  "http://localhost:5000";

// Global socket instance to prevent multiple connections
let globalSocketInstance = null;
let globalSocketToken = null;
let globalSocketListeners = new Set();
let hasLoggedConnection = false;

export const useSocket = () => {
  const { tokens } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);
  const connectionAttemptRef = useRef(null);
  const lastTokenRef = useRef(null);
  const listenerIdRef = useRef(Symbol());

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
      // Remove this listener from global set
      globalSocketListeners.delete(listenerIdRef.current);
      // Clean up global socket if no listeners remain
      if (globalSocketListeners.size === 0 && globalSocketInstance) {
        try {
          globalSocketInstance.removeAllListeners();
          globalSocketInstance.disconnect();
        } catch (e) {
          // Ignore errors during cleanup
        }
        globalSocketInstance = null;
        globalSocketToken = null;
      }
      setSocket(null);
      setIsConnected(false);
      lastTokenRef.current = null;
      return;
    }

    // Use global socket instance if it exists and token matches
    if (globalSocketInstance && globalSocketToken === tokens.accessToken && globalSocketInstance.connected) {
      globalSocketListeners.add(listenerIdRef.current);
      socketRef.current = globalSocketInstance;
      setSocket(globalSocketInstance);
      setIsConnected(globalSocketInstance.connected);
      lastTokenRef.current = tokens.accessToken;
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
      // Use polling first for better compatibility with Render and other hosting services
      const newSocket = io(SOCKET_URL, {
        auth: {
          token: tokens.accessToken,
        },
        // Try polling first, then upgrade to websocket if available
        transports: ["polling", "websocket"],
        upgrade: true,
        rememberUpgrade: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: Infinity,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        autoConnect: true,
        // Suppress default error logging
        forceNew: false,
        // Additional options for production stability
        withCredentials: true,
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
        setIsConnected(true);
        lastTokenRef.current = tokens.accessToken;
        // Store as global instance
        globalSocketInstance = newSocket;
        globalSocketToken = tokens.accessToken;
        globalSocketListeners.add(listenerIdRef.current);
        
        // Only log the first connection, not subsequent ones from the same socket
        if (!hasLoggedConnection) {
          // eslint-disable-next-line no-console
          console.log("[Socket.IO] Connected");
          hasLoggedConnection = true;
        }
      });

      newSocket.on("disconnect", (reason) => {
        setIsConnected(false);
        // Reset connection log flag on disconnect
        if (reason === "io client disconnect" || reason === "io server disconnect") {
          hasLoggedConnection = false;
        }
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
        
        // Handle authentication errors - clear tokens if auth fails
        if (error.message?.includes("Authentication error") || error.message?.includes("Auth error")) {
          // Clear tokens on auth failure
          clearStoredTokens();
          notifyAuthUpdate(null);
          
          if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.warn("[Socket.IO] Authentication failed - tokens cleared. Please log in again.");
          }
          return;
        }
        
        // Suppress all WebSocket and connection errors - these are expected in production
        const shouldSuppress = 
          error.message?.includes("xhr poll error") ||
          error.message?.includes("websocket error") ||
          error.message?.includes("WebSocket") ||
          error.message?.includes("TransportError") ||
          error.type === "TransportError" ||
          error.message?.includes("Connection refused") ||
          error.message?.includes("closed before the connection is established") ||
          error.message?.includes("timeout") ||
          error.message?.includes("NetworkError") ||
          error.message?.includes("Failed to fetch") ||
          error.message?.includes("ERR_CONNECTION") ||
          error.message?.includes("ERR_INTERNET_DISCONNECTED");
        
        // Silent fail for all other connection errors - socket will retry automatically
      });

      // Handle transport upgrades (polling -> websocket)
      newSocket.on("upgrade", () => {
        // Connection upgraded successfully, no need to log
      });

      // Handle transport errors silently
      newSocket.io.on("error", (error) => {
        // Suppress all transport errors
        const shouldSuppress = 
          error.message?.includes("WebSocket") ||
          error.message?.includes("transport") ||
          error.type === "TransportError";
        
        if (!shouldSuppress && import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.warn("[Socket.IO] Transport error:", error.message);
        }
      });

      socketRef.current = newSocket;
      setSocket(newSocket);
    }, 300); // 300ms debounce to prevent rapid reconnections

    return () => {
      if (connectionAttemptRef.current) {
        clearTimeout(connectionAttemptRef.current);
        connectionAttemptRef.current = null;
      }
      // Remove this listener from global set
      globalSocketListeners.delete(listenerIdRef.current);
      // Only disconnect global socket if no listeners remain
      if (globalSocketListeners.size === 0 && globalSocketInstance) {
        try {
          globalSocketInstance.removeAllListeners();
          globalSocketInstance.disconnect();
        } catch (e) {
          // Ignore errors during cleanup
        }
        globalSocketInstance = null;
        globalSocketToken = null;
        hasLoggedConnection = false;
      }
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    };
  }, [tokens?.accessToken]);

  return { socket, isConnected };
};

