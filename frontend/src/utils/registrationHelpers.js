export const MIN_PASSWORD_LENGTH = 8;

export const safeString = (value) => {
  if (typeof value === "string") {
    return value.trim();
  }
  if (value === null || value === undefined) {
    return "";
  }
  return String(value).trim();
};

export const isValidEmail = (email) =>
  /\S+@\S+\.\S+/.test(safeString(email).toLowerCase());

export const validatePasswordPair = (
  password,
  confirmPassword,
  minimum = MIN_PASSWORD_LENGTH
) => {
  const cleanedPassword = safeString(password);
  const cleanedConfirm = safeString(confirmPassword);

  if (!cleanedPassword) {
    return "Please enter a password.";
  }

  if (cleanedPassword.length < minimum) {
    return `Password must be at least ${minimum} characters long.`;
  }

  if (cleanedPassword !== cleanedConfirm) {
    return "Passwords do not match. Please confirm your password.";
  }

  return null;
};

export const parseCommaSeparated = (value) =>
  safeString(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export const splitLocation = (value) => {
  const cleaned = safeString(value);
  if (!cleaned) {
    return {
      city: "",
      country: "",
    };
  }
  const segments = cleaned
    .split(",")
    .map((segment) => segment.trim())
    .filter(Boolean);
  if (segments.length === 0) {
    return {
      city: "",
      country: "",
    };
  }
  if (segments.length === 1) {
    return {
      city: "",
      country: segments[0],
    };
  }

  const country = segments.pop() ?? "";
  const city = segments.join(", ");
  return {
    city,
    country,
  };
};

export const sanitizeUrl = (value) => {
  const cleaned = safeString(value);
  if (!cleaned) return "";
  if (/^https?:\/\//i.test(cleaned)) {
    return cleaned;
  }
  return `https://${cleaned}`;
};
