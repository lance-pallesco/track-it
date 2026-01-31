/**
 * Auth input validation utilities.
 * Centralizes validation logic for registration and login.
 */

// Simple email regex - RFC 5322 compliant subset
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password: min 8 chars (extend PASSWORD_REGEX for stricter rules if needed)
const MIN_PASSWORD_LENGTH = 8;

export interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export function validateRegister(input: unknown): ValidationResult<RegisterInput> {
  if (!input || typeof input !== "object") {
    return { success: false, error: "Invalid request body" };
  }

  const { firstName, lastName, email, password } = input as Record<string, unknown>;

  if (!firstName || typeof firstName !== "string" || firstName.trim().length === 0) {
    return { success: false, error: "First name is required" };
  }

  if (!lastName || typeof lastName !== "string" || lastName.trim().length === 0) {
    return { success: false, error: "Last name is required" };
  }

  if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
    return { success: false, error: "Valid email is required" };
  }

  if (!password || typeof password !== "string") {
    return { success: false, error: "Password is required" };
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      success: false,
      error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
    };
  }

  return {
    success: true,
    data: {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      password,
    },
  };
}

export function validateLogin(input: unknown): ValidationResult<LoginInput> {
  if (!input || typeof input !== "object") {
    return { success: false, error: "Invalid request body" };
  }

  const { email, password } = input as Record<string, unknown>;

  if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
    return { success: false, error: "Valid email is required" };
  }

  if (!password || typeof password !== "string" || password.length === 0) {
    return { success: false, error: "Password is required" };
  }

  return {
    success: true,
    data: {
      email: email.trim().toLowerCase(),
      password,
    },
  };
}
