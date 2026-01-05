import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  loginUserAccount,
  logoutRecruiterAccount,
  registerUserAccount,
} from "../services/api/auth";
import {
  clearStoredTokens,
  getStoredTokens,
  persistTokens,
  registerAuthUpdateHandler,
} from "../services/api/baseClient";
import { updateRecruiterProfile } from "../services/api/recruiter.js";
import { isTokenExpired, getTokenExpiration } from "../utils/jwt.js";
import { refreshRecruiterSession } from "../services/api/auth.js";

import { generateUUID, generateShortId } from "../utils/uuid";

const AuthContext = createContext(null);

const STORAGE_KEYS = {
  USERS: "aela.auth.users",
  SESSION: "aela.auth.session",
};

const generateId = (prefix) => {
  return prefix ? generateShortId(prefix) : generateUUID();
};

export const ROLE_DETAILS = {
  "super-admin": {
    label: "Super Admin",
    landing: "/super-admin",
    description: "Platform oversight, approvals, and analytics.",
  },
  teacher: {
    label: "Teacher",
    landing: "/teacher/dashboard",
    description: "Create learning experiences and mentor students.",
  },
  student: {
    label: "Student",
    landing: "/student/dashboard",
    description: "Access courses, games, and rewards.",
  },
  recruiter: {
    label: "Recruiter",
    landing: "/recruiter/dashboard",
    description: "Post jobs and review applicants.",
  },
  influencer: {
    label: "Influencer",
    landing: "/learn-earn/dashboard",
    description: "Engage communities and co-create challenges.",
  },
  freelancer: {
    label: "Freelancer",
    landing: "/learn-earn/dashboard",
    description: "Access gigs, courses, and rewards.",
  },
  "branch-owner": {
    label: "Branch Owner",
    landing: "/",
    description: "Manage local hubs and partnerships.",
  },
};

const DEFAULT_USERS = [
  {
    id: "user-super-admin",
    role: "super-admin",
    email: "admin@digitalaela.com",
    password: "admin123",
    fullName: "Imran Khan",
    createdAt: "2024-01-01T00:00:00.000Z",
    metadata: {
      title: "Founder · Digital AELA",
    },
  },
];

const toPublicUser = (user) => {
  if (!user) return null;
  const { password, ...safeUser } = user;
  return safeUser;
};

const loadUsersFromStorage = () => {
  if (typeof window === "undefined") {
    return [...DEFAULT_USERS];
  }
  const stored = window.localStorage.getItem(STORAGE_KEYS.USERS);
  if (!stored) {
    return [...DEFAULT_USERS];
  }
  try {
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      return [...DEFAULT_USERS];
    }
    const merged = [...parsed];
    const hasAdmin = merged.some((user) => user.email === DEFAULT_USERS[0].email);
    if (!hasAdmin) {
      merged.push(DEFAULT_USERS[0]);
    }
    return merged;
  } catch {
    return [...DEFAULT_USERS];
  }
};

const loadSessionFromStorage = () => {
  if (typeof window === "undefined") {
    return null;
  }
  const stored = window.localStorage.getItem(STORAGE_KEYS.SESSION);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [users, setUsers] = useState(loadUsersFromStorage);
  const [user, setUser] = useState(() => {
    const stored = loadSessionFromStorage();
    return stored ?? null;
  });
  const [tokens, setTokens] = useState(() => getStoredTokens());

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (user) {
      window.localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(STORAGE_KEYS.SESSION);
    }
  }, [user]);

  const handleBackendAuthSuccess = useCallback((authPayload) => {
    if (!authPayload?.user) return null;
    const normalizedUser = {
      id: authPayload.user.id,
      role: authPayload.user.role,
      email: authPayload.user.email,
      fullName: authPayload.user.fullName,
      createdAt: authPayload.user.createdAt,
      isActive: authPayload.user.isActive !== undefined ? authPayload.user.isActive : true,
      metadata: authPayload.user.metadata ?? {},
      source: "backend",
    };
    setUser(normalizedUser);
    const nextTokens = {
      accessToken: authPayload.accessToken,
      refreshToken: authPayload.refreshToken,
    };
    setTokens(nextTokens);
    persistTokens(nextTokens);
    return normalizedUser;
  }, []);

  useEffect(() => {
    registerAuthUpdateHandler((authPayload) => {
      if (!authPayload) {
        setUser(null);
        setTokens(null);
        return;
      }
      handleBackendAuthSuccess(authPayload);
    });
  }, [handleBackendAuthSuccess]);

  const login = useCallback(
    async ({ email, password, role }) => {
      const normalizedEmail = String(email || "")
        .trim()
        .toLowerCase();
      if (!normalizedEmail || !password) {
        throw new Error("Please enter both email and password.");
      }

      // Try backend auth first for all roles
      try {
        // Add timeout wrapper for login request (15 seconds)
        const loginPromise = loginUserAccount({ email: normalizedEmail, password, role });
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Login request timed out. Please check your connection and try again.")), 15000)
        );
        
        const authResult = await Promise.race([loginPromise, timeoutPromise]);
        return handleBackendAuthSuccess(authResult);
      } catch (backendError) {
        // Check if it's a timeout or network error
        if (backendError.message?.includes("timed out") || 
            backendError.code === "REQUEST_TIMEOUT" || 
            backendError.isNetworkError) {
          // For network/timeout errors, try fallback immediately
          // eslint-disable-next-line no-console
          console.warn("Backend auth timed out or failed, falling back to mock auth:", backendError.message);
        } else {
          // For other errors, log and try fallback
          // eslint-disable-next-line no-console
          console.warn("Backend auth failed, falling back to mock auth:", backendError);
        }
        
        const existing = users.find((item) => item.email === normalizedEmail);
        if (!existing) {
          // Provide better error message based on error type
          if (backendError.code === "REQUEST_TIMEOUT" || backendError.isNetworkError) {
            throw new Error("Unable to connect to server. Please check your internet connection and try again.");
          }
          throw new Error("Account not found. Please register first.");
        }

        if (role && existing.role !== role) {
          const expected = ROLE_DETAILS[existing.role]?.label ?? existing.role;
          throw new Error(
            `This email is registered as ${expected}. Try logging in via the correct portal.`
          );
        }

        if (existing.password !== password) {
          throw new Error("Incorrect password. Please try again.");
        }

        const safeUser = toPublicUser(existing);
        setUser(safeUser);
        return safeUser;
      }
    },
    [users, handleBackendAuthSuccess]
  );

  const register = useCallback(
    async ({ email, password, role, profile, profileImage }) => {
      const normalizedEmail = String(email || "")
        .trim()
        .toLowerCase();

      if (!normalizedEmail || !password || !role) {
        throw new Error("Email, password, and role are required.");
      }

      const fullName =
        profile?.fullName?.trim() ||
        profile?.name?.trim() ||
        normalizedEmail.split("@")[0];

      // Try backend auth first for all roles
      try {
        // Use file upload utility if profileImage is provided
        if (profileImage) {
          const { registerWithFile } = await import("../utils/fileUpload");
          const authResult = await registerWithFile(profileImage, {
            email: normalizedEmail,
            password,
            fullName,
            role,
            profile: profile,
          });
          return handleBackendAuthSuccess(authResult);
        } else {
          // Use regular registration without file
          const authResult = await registerUserAccount({
            email: normalizedEmail,
            password,
            fullName,
            role,
            profile: profile, // Include profile data for student profile creation
          });
          return handleBackendAuthSuccess(authResult);
        }
      } catch (backendError) {
        // Don't fall back to mock auth for specific backend errors
        // These should be handled by the UI components
        if (backendError.status === 409 || backendError.code === "CONFLICT") {
          // Email already exists - don't fall back to mock auth
          throw new Error("An account with this email already exists. Try signing in instead.");
        }
        
        if (backendError.status === 422 || backendError.code === "VALIDATION_ERROR") {
          // Validation error - don't fall back to mock auth
          throw backendError;
        }

        // For other errors, fall back to mock auth for backward compatibility
        // eslint-disable-next-line no-console
        console.warn("Backend registration failed, falling back to mock auth:", backendError);
        
        const existing = users.find((item) => item.email === normalizedEmail);
        if (existing) {
          throw new Error("An account with this email already exists. Try signing in instead.");
        }

        const id = generateId("user");
        const newUserRecord = {
          id,
          role,
          email: normalizedEmail,
          password,
          fullName,
          createdAt: new Date().toISOString(),
          metadata: profile ?? {},
        };

        setUsers((prev) => [...prev, newUserRecord]);
        const safeUser = toPublicUser(newUserRecord);
        setUser(safeUser);
        return safeUser;
      }
    },
    [users, handleBackendAuthSuccess]
  );

  const logout = useCallback(
    async (options = {}) => {
      try {
        // If user has backend tokens, call logout endpoint
        if (tokens?.accessToken) {
          // Set a timeout for logout request (5 seconds)
          const logoutPromise = logoutRecruiterAccount();
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Logout timeout")), 5000)
          );
          await Promise.race([logoutPromise, timeoutPromise]).catch(() => {
            // swallow logout errors and timeout
          });
        }
      } catch (error) {
        // Ignore logout errors
      } finally {
        // Always clear local state regardless of backend response
        setUser(null);
        setTokens(null);
        if (!options.preserveSession) {
          clearStoredTokens();
          // Also clear session from localStorage
          if (typeof window !== "undefined") {
            window.localStorage.removeItem(STORAGE_KEYS.SESSION);
          }
        }
        // Clear financial auth session on logout
        if (typeof window !== "undefined") {
          window.sessionStorage.removeItem("aela.financial.auth");
        }
      }
    },
    [tokens]
  );

  useEffect(() => {
    if (user?.role === "recruiter" && !tokens?.accessToken) {
      logout().catch(() => {
        // ignore
      });
    }
  }, [user, tokens, logout]);

  // Proactive token refresh - refresh tokens 5 minutes before expiration
  useEffect(() => {
    if (!tokens?.accessToken || !tokens?.refreshToken) {
      return;
    }

    const refreshTokensProactively = async () => {
      try {
        // Check if token is expired or about to expire (within 5 minutes)
        if (isTokenExpired(tokens.accessToken, 5)) {
          const refreshedTokens = await refreshRecruiterSession(tokens.refreshToken);
          handleBackendAuthSuccess(refreshedTokens);
        }
      } catch (error) {
        console.warn("Failed to refresh tokens proactively:", error);
        // If refresh fails, logout the user
        logout().catch(() => {});
      }
    };

    // Set up timer to check token expiration every minute
    const checkInterval = setInterval(() => {
      refreshTokensProactively();
    }, 60000); // Check every minute

    // Also check immediately when tokens change
    refreshTokensProactively();

    return () => clearInterval(checkInterval);
  }, [tokens, handleBackendAuthSuccess, logout]);

  const updateUserMetadata = useCallback(
    async (updates) => {
      if (!user) return null;
      if (user.role === "recruiter") {
        try {
          const payload = {
            fullName: updates.fullName,
            bio: updates.metadata?.bio,
            company: updates.metadata?.company,
            headline: updates.metadata?.headline,
            avatarUrl: updates.metadata?.avatarUrl,
            socials: updates.metadata?.socials,
          };
          const profile = await updateRecruiterProfile(payload);
          setUser((prev) =>
            prev
              ? {
                  ...prev,
                  fullName: profile?.user?.fullName ?? updates.fullName ?? prev.fullName,
                  metadata: {
                    ...prev.metadata,
                    ...updates.metadata,
                    recruiterProfile: profile,
                  },
                }
              : prev
          );
          return profile;
        } catch (error) {
          throw error;
        }
      }

      setUsers((prev) =>
        prev.map((record) =>
          record.id === user.id
            ? {
                ...record,
                fullName: updates.fullName ?? record.fullName,
                metadata: {
                  ...record.metadata,
                  ...updates.metadata,
                },
              }
            : record
        )
      );
      setUser((prev) =>
        prev
          ? {
              ...prev,
              fullName: updates.fullName ?? prev.fullName,
              metadata: {
                ...prev.metadata,
                ...updates.metadata,
              },
            }
          : prev
      );
      return null;
    },
    [user]
  );

  const getRoleLabel = useCallback((role) => ROLE_DETAILS[role]?.label ?? "Member", []);

  const getRoleHome = useCallback((role) => ROLE_DETAILS[role]?.landing ?? "/", []);

  const value = useMemo(
    () => ({
      user,
      users,
      isAuthenticated: Boolean(user),
      tokens,
      login,
      register,
      logout,
      updateUserMetadata,
      getRoleLabel,
      getRoleHome,
      roleDetails: ROLE_DETAILS,
    }),
    [user, users, tokens, login, register, logout, updateUserMetadata, getRoleLabel, getRoleHome]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

