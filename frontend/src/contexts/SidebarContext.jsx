import { createContext, useContext, useState } from "react";

const SidebarContext = createContext(null);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

// Safe hook that returns null if context is not available
export const useSidebarSafe = () => {
  try {
    return useContext(SidebarContext);
  } catch {
    return null;
  }
};

export const SidebarProvider = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const openSidebar = () => setIsSidebarOpen(true);
  const closeSidebar = () => setIsSidebarOpen(false);
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  return (
    <SidebarContext.Provider
      value={{
        isSidebarOpen,
        openSidebar,
        closeSidebar,
        toggleSidebar,
        setIsSidebarOpen,
      }}>
      {children}
    </SidebarContext.Provider>
  );
};

