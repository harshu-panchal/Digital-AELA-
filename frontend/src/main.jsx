import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import { PointsProvider } from "./contexts/PointsContext";
import { UserProvider } from "./contexts/UserContext";
import { BlogProvider } from "./contexts/BlogContext";
import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <PointsProvider>
          <UserProvider>
            <BlogProvider>
            <App />
            </BlogProvider>
          </UserProvider>
        </PointsProvider>
      </LanguageProvider>
    </BrowserRouter>
  </StrictMode>
);
