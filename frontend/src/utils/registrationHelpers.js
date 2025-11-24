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

export const isValidPhone = (phone) => {
  const value = safeString(phone);
  if (!value) return false;
  
  // Remove all non-digit characters to check if we have enough digits
  const digitsOnly = value.replace(/\D/g, '');
  
  // Must have at least 6 digits and at most 15 digits (E.164 standard allows up to 15)
  if (digitsOnly.length < 6 || digitsOnly.length > 15) {
    return false;
  }
  
  // Check that the value only contains valid phone characters
  // Allowed: digits (0-9), spaces, plus sign (+), dashes (-), parentheses (), dots (.), slashes (/)
  // Using explicit character class with - at the end to avoid range interpretation
  // The + character in a character class is literal and doesn't need escaping
  const validPhonePattern = /^[0-9\s+()./\-]+$/;
  if (!validPhonePattern.test(value)) {
    return false;
  }
  
  return true;
};

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

/**
 * Validates Join Us form data against configuration. Returns an array of issues.
 */
export const validateJoinUsForm = (formConfig, data) => {
  const issues = [];

  formConfig.forEach((field) => {
    const rawValue = data[field.name];
    const value = safeString(rawValue);

    if (field.required && !value) {
      issues.push(`Please provide ${field.label.toLowerCase()}.`);
      return;
    }

    if (!value) {
      return;
    }

    if (field.type === "email" && !isValidEmail(value)) {
      issues.push("Please enter a valid email address.");
      return;
    }

    if (field.type === "url") {
      const sanitized = sanitizeUrl(value);
      if (!/^https?:\/\//i.test(sanitized)) {
        issues.push(
          "Please enter a valid URL starting with http:// or https://."
        );
      }
    }
  });

  return issues;
};

export const validateContactForm = (fields, data) => {
  const issues = [];

  fields.forEach((field) => {
    const { name, label, required = true, type = "text" } = field;
    const value = safeString(data[name]);

    if (required && !value) {
      issues.push(`Please provide ${label.toLowerCase()}.`);
      return;
    }

    if (!value) {
      return;
    }

    if (type === "email" && !isValidEmail(value)) {
      issues.push("Please enter a valid email address.");
      return;
    }

    if (
      (type === "tel" ||
        name.toLowerCase().includes("phone") ||
        name.toLowerCase().includes("contact")) &&
      !isValidPhone(value)
    ) {
      issues.push("Please enter a valid contact number.");
      return;
    }

    if (
      type === "url" ||
      name.toLowerCase().includes("link") ||
      name.toLowerCase().includes("website")
    ) {
      const sanitized = sanitizeUrl(value);
      if (!/^https?:\/\//i.test(sanitized)) {
        issues.push(
          "Please enter a valid URL starting with http:// or https://."
        );
      }
    }
  });

  return issues;
};
