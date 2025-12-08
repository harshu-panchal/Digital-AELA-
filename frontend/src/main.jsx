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
import { API_BASE_URL } from "./config/api.js";
import "./index.css";
import App from "./App.jsx";

// Diagnostic check for production API configuration
if (import.meta.env.PROD && typeof window !== "undefined") {
  const apiUrl = API_BASE_URL;
  const envUrl = import.meta.env.VITE_API_URL;

  // Check if API URL is pointing to localhost in production (configuration error)
  if (apiUrl.includes("localhost") || apiUrl.includes("127.0.0.1")) {
    console.error(
      "%c🚨 PRODUCTION CONFIGURATION ERROR 🚨",
      "color: red; font-size: 16px; font-weight: bold;"
    );
    console.error(
      "Translation and API calls will fail because VITE_API_URL is not set correctly.\n" +
        `Current API URL: ${apiUrl}\n` +
        `VITE_API_URL from env: ${envUrl || "NOT SET"}\n\n` +
        "SOLUTION:\n" +
        "1. Go to your deployment platform (Vercel/Netlify/etc.)\n" +
        "2. Add environment variable: VITE_API_URL\n" +
        "3. Set value to: https://your-backend-domain.com/api/v1\n" +
        "4. Redeploy your application\n\n" +
        "See TRANSLATION_PRODUCTION_FIX.md for detailed instructions."
    );
  }
}

// Suppress harmless console errors (WebSocket, YouTube ads, etc.)
if (typeof window !== "undefined") {
  const originalError = console.error;
  const originalWarn = console.warn;

  // Suppress console.error for harmless errors
  console.error = function (...args) {
    const firstArg = args[0];
    const message = firstArg?.toString() || "";
    const stack = firstArg?.stack || "";
    const fullMessage = args.join(" ").toLowerCase();

    // Suppress Socket.IO WebSocket connection errors
    const isSocketIOError =
      (message.includes("WebSocket connection to") ||
        stack.includes("WebSocket")) &&
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
  console.warn = function (...args) {
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

const AppContent = (
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
);

// Only use StrictMode in development
const rootElement = import.meta.env.PROD ? (
  AppContent
) : (
  <StrictMode>{AppContent}</StrictMode>
);

createRoot(document.getElementById("root")).render(rootElement);
