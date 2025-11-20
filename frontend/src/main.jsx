import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import { PointsProvider } from "./contexts/PointsContext";
import { UserProvider } from "./contexts/UserContext";
import { BlogProvider } from "./contexts/BlogContext";
import { AuthProvider } from "./contexts/AuthContext";
import { SidebarProvider } from "./contexts/SidebarContext";
import "./index.css";
import App from "./App.jsx";

// Suppress WebSocket connection errors in console (these are handled by Socket.IO)
// Only suppress the specific "closed before connection established" errors
if (typeof window !== "undefined") {
  const originalError = console.error;
  console.error = function(...args) {
    // Check if this is a WebSocket connection error we want to suppress
    const firstArg = args[0];
    const message = firstArg?.toString() || "";
    const stack = firstArg?.stack || "";
    
    // Suppress only Socket.IO WebSocket connection errors
    const isSocketIOError = 
      (message.includes("WebSocket connection to") || stack.includes("WebSocket")) &&
      (message.includes("socket.io") || message.includes("/socket.io/")) &&
      (message.includes("closed before the connection is established") ||
       message.includes("failed: WebSocket"));
    
    if (isSocketIOError) {
      // Silently ignore - Socket.IO will handle reconnection automatically
      return;
    }
    
    // Call original console.error for all other errors
    originalError.apply(console, args);
  };
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
        <SidebarProvider>
        <PointsProvider>
          <UserProvider>
            <BlogProvider>
            <App />
            </BlogProvider>
          </UserProvider>
        </PointsProvider>
        </SidebarProvider>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  </StrictMode>
);
