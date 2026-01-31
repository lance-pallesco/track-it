/**
 * Logout API - invalidates the current session and clears the session cookie.
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { logoutUser } from "@/lib/services/auth.service";

export async function POST() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session")?.value;

  if (sessionToken) {
    await logoutUser(sessionToken);
  }

  const response = NextResponse.json({ message: "Logged out successfully" });
  response.cookies.set("session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0, // Expire immediately
  });

  return response;
}
