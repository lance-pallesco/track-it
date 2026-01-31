/**
 * Authentication service - business logic for auth flows.
 * Keeps API routes thin; handles password hashing, session creation, etc.
 */

import bcrypt from "bcrypt";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const SALT_ROUNDS = 12;
const SESSION_DURATION_DAYS = 7;

export interface RegisterResult {
  success: true;
  userId: string;
}

export interface RegisterError {
  success: false;
  code: "EMAIL_EXISTS" | "VALIDATION_ERROR" | "SERVER_ERROR";
  message: string;
}

export type RegisterResponse = RegisterResult | RegisterError;

export async function registerUser(
  email: string,
  password: string,
  firstName: string,
  lastName: string
): Promise<RegisterResponse> {
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existingUser) {
    return {
      success: false,
      code: "EMAIL_EXISTS",
      message: "Email already in use",
    };
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  try {
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
      },
    });

    return { success: true, userId: user.id };
  } catch {
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to create account",
    };
  }
}

export interface LoginResult {
  success: true;
  sessionToken: string;
  expires: Date;
}

export interface LoginError {
  success: false;
  code: "INVALID_CREDENTIALS" | "VALIDATION_ERROR";
  message: string;
}

export type LoginResponse = LoginResult | LoginError;

export async function loginUser(email: string, password: string): Promise<LoginResponse> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    return {
      success: false,
      code: "INVALID_CREDENTIALS",
      message: "Invalid email or password",
    };
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return {
      success: false,
      code: "INVALID_CREDENTIALS",
      message: "Invalid email or password",
    };
  }

  const sessionToken = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      userId: user.id,
      sessionToken,
      expires,
    },
  });

  return {
    success: true,
    sessionToken,
    expires,
  };
}

export async function logoutUser(sessionToken: string): Promise<void> {
  await prisma.session.deleteMany({
    where: { sessionToken },
  });
}
