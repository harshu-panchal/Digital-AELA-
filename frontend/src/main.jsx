import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import { PointsProvider } from "./contexts/PointsContext";
import { UserProvider } from "./contexts/UserContext";
import { BlogProvider } from "./contexts/BlogContext";
import { AuthProvider } from "./contexts/AuthContext";
import { SidebarProvider } from "./contexts/SidebarContext";
import { FinancialAuthProvider } from "./contexts/FinancialAuthContext";
import "./index.css";
import App from "./App.jsx";

// Suppress harmless console errors (WebSocket, YouTube ads, etc.)
if (typeof window !== "undefined") {
  const originalError = console.error;
  const originalWarn = console.warn;
  
  // Suppress console.error for harmless errors
  console.error = function(...args) {
    const firstArg = args[0];
    const message = firstArg?.toString() || "";
    const stack = firstArg?.stack || "";
    const fullMessage = args.join(" ").toLowerCase();
    
    // Suppress Socket.IO WebSocket connection errors
    const isSocketIOError = 
      (message.includes("WebSocket connection to") || stack.includes("WebSocket")) &&
      (message.includes("socket.io") || message.includes("/socket.io/")) &&
      (message.includes("closed before the connection is established") ||
       message.includes("failed: WebSocket"));
    
    // Suppress YouTube/Google Ads blocked errors (harmless - ad blockers)
    const isYouTubeAdError = 
      fullMessage.includes("err_blocked_by_client") ||
      fullMessage.includes("doubleclick.net") ||
      fullMessage.includes("googleads.g.doubleclick.net") ||
      fullMessage.includes("ad_status.js") ||
      (message.includes("GET") && fullMessage.includes("doubleclick"));
    
    if (isSocketIOError || isYouTubeAdError) {
      // Silently ignore - these are expected and harmless
      return;
    }
    
    // Call original console.error for all other errors
    originalError.apply(console, args);
  };
  
  // Suppress console.warn for the same harmless errors
  console.warn = function(...args) {
    const fullMessage = args.join(" ").toLowerCase();
    
    // Suppress YouTube/Google Ads blocked warnings
    const isYouTubeAdWarning = 
      fullMessage.includes("err_blocked_by_client") ||
      fullMessage.includes("doubleclick.net") ||
      fullMessage.includes("googleads.g.doubleclick.net") ||
      fullMessage.includes("ad_status.js");
    
    if (isYouTubeAdWarning) {
      // Silently ignore - these are expected and harmless
      return;
    }
    
    // Call original console.warn for all other warnings
    originalWarn.apply(console, args);
  };
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <FinancialAuthProvider>
            <SidebarProvider>
              <PointsProvider>
                <UserProvider>
                  <BlogProvider>
                    <App />
                  </BlogProvider>
                </UserProvider>
              </PointsProvider>
            </SidebarProvider>
          </FinancialAuthProvider>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  </StrictMode>
);
