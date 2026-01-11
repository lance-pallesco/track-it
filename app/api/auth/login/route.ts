import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import crypto from "crypto";    

export async function POST(request: Request) {
    const { email, password } = await request.json();
    const user = await prisma.user.findUnique({
        where: { email },
    });
    if (!user) {
        return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const sessionToken = crypto.randomBytes(32).toString("hex");
    const session = await prisma.session.create({
        data: {
            userId: user.id,
            sessionToken,
            expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
    })
    const cookieStore = await cookies()
    cookieStore.set("session", session.sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 7 * 24 * 60 * 60, // 7 days
    })
    return NextResponse.json({ message: "Login successful!" }, { status: 200 });
    
}