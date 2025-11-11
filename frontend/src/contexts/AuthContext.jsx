import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext(null);

const STORAGE_KEYS = {
  USERS: "aela.auth.users",
  SESSION: "aela.auth.session",
};

const fallbackId = (prefix = "user") =>
  `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;

const generateId = (prefix) => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    try {
      return crypto.randomUUID();
    } catch {
      return fallbackId(prefix);
    }
  }
  return fallbackId(prefix);
};

export const ROLE_DETAILS = {
  "super-admin": {
    label: "Super Admin",
    landing: "/learn-earn/admin",
    description: "Platform oversight, approvals, and analytics.",
  },
  teacher: {
    label: "Teacher",
    landing: "/learn-earn/dashboard",
    description: "Create learning experiences and mentor students.",
  },
  student: {
    label: "Student",
    landing: "/learn-earn/dashboard",
    description: "Access courses, games, and rewards.",
  },
  recruiter: {
    label: "Recruiter",
    landing: "/explore-jobs/recruiter-dashboard",
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

  const login = useCallback(
    async ({ email, password, role }) => {
      const normalizedEmail = String(email || "")
        .trim()
        .toLowerCase();
      if (!normalizedEmail || !password) {
        throw new Error("Please enter both email and password.");
      }

      const existing = users.find((item) => item.email === normalizedEmail);
      if (!existing) {
        throw new Error("Account not found. Please register first.");
      }

      if (role && existing.role !== role) {
        const expected = ROLE_DETAILS[existing.role]?.label ?? existing.role;
        throw new Error(`This email is registered as ${expected}. Try logging in via the correct portal.`);
      }

      if (existing.password !== password) {
        throw new Error("Incorrect password. Please try again.");
      }

      const safeUser = toPublicUser(existing);
      setUser(safeUser);
      return safeUser;
    },
    [users]
  );

  const register = useCallback(
    async ({ email, password, role, profile }) => {
      const normalizedEmail = String(email || "")
        .trim()
        .toLowerCase();

      if (!normalizedEmail || !password || !role) {
        throw new Error("Email, password, and role are required.");
      }

      const existing = users.find((item) => item.email === normalizedEmail);
      if (existing) {
        throw new Error("An account with this email already exists. Try signing in instead.");
      }

      const id = generateId("user");
      const fullName =
        profile?.fullName?.trim() ||
        profile?.name?.trim() ||
        normalizedEmail.split("@")[0];

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
    },
    [users]
  );

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const updateUserMetadata = useCallback(
    (updates) => {
      if (!user) return null;
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
      login,
      register,
      logout,
      updateUserMetadata,
      getRoleLabel,
      getRoleHome,
      roleDetails: ROLE_DETAILS,
    }),
    [user, users, login, register, logout, updateUserMetadata, getRoleLabel, getRoleHome]
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

