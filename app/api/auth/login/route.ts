/**
 * Login API - validates credentials, creates session, sets httpOnly cookie.
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { validateLogin } from "@/lib/validations/auth";
import { loginUser } from "@/lib/services/auth.service";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const validation = validateLogin(body);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const result = await loginUser(validation.data!.email, validation.data!.password);

  if (!result.success) {
    return NextResponse.json(
      { error: result.message },
      { status: result.code === "INVALID_CREDENTIALS" ? 401 : 400 }
    );
  }

  const cookieStore = await cookies();
  cookieStore.set("session", result.sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });

  return NextResponse.json({ message: "Login successful" });
}
