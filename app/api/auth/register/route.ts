/**
 * Register API - validates input, checks duplicate email, creates user.
 */

import { NextResponse } from "next/server";
import { validateRegister } from "@/lib/validations/auth";
import { registerUser } from "@/lib/services/auth.service";

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

  const validation = validateRegister(body);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const { email, password, firstName, lastName } = validation.data!;
  const result = await registerUser(email, password, firstName, lastName);

  if (!result.success) {
    const status =
      result.code === "EMAIL_EXISTS" ? 409 :
      result.code === "VALIDATION_ERROR" ? 400 : 500;
    return NextResponse.json({ error: result.message }, { status });
  }

  return NextResponse.json(
    { message: "User registered successfully" },
    { status: 201 }
  );
}
