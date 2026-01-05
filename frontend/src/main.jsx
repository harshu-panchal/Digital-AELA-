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
import ErrorBoundary from "./components/ErrorBoundary";
import "./index.css";
import App from "./App.jsx";

// Diagnostic check for production API configuration
if (import.meta.env.PROD && typeof window !== "undefined") {
  const apiUrl = API_BASE_URL || "";
  const envUrl = import.meta.env.VITE_API_URL || "";

  // Check if API URL is pointing to localhost in production (configuration error)
  if (apiUrl && (apiUrl.includes("localhost") || apiUrl.includes("127.0.0.1"))) {
    console.error(
      "%c🚨 PRODUCTION CONFIGURATION ERROR 🚨",
      "color: red; font-size: 16px; font-weight: bold;"
    );
  }
}

// Suppress only specific, truly harmless console errors if needed, 
// but avoid broad monkey-patching that can hide compatibility issues.
if (typeof window !== "undefined" && import.meta.env.PROD) {
  const originalError = console.error;
  console.error = function (...args) {
    const message = args[0]?.toString() || "";
    
    // Only suppress very specific known harmless noise in production
    if (message.includes("socket.io") && message.includes("WebSocket connection to")) {
      return;
    }
    
    originalError.apply(console, args);
  };
}

const AppContent = (
  <ErrorBoundary>
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
  </ErrorBoundary>
);

// Only use StrictMode in development
const rootElement = import.meta.env.PROD ? (
  AppContent
) : (
  <StrictMode>{AppContent}</StrictMode>
);

createRoot(document.getElementById("root")).render(rootElement);
