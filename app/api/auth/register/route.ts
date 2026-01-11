import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(request: Request) {
    const { firstName, lastName, email, password } = await request.json();
    if (!firstName || !lastName || !email || !password) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (password.length < 8) {
        return NextResponse.json({ error: "Password must be at least 8 characters long" }, { status: 400 });
    }
    try {
        const hashedPassword = await bcrypt.hash(password, 12);
        const newUser = await prisma.user.create({
            data: {
                firstName,
                lastName,
                email,
                password: hashedPassword,
            },
        });
        return NextResponse.json({ message: "User registered successfully!" }, { status: 201 });
    } catch (error : any) {
        if (error.code === 'P2002') {
            return NextResponse.json({ error: "Email already in use!" }, { status: 409 });
        }
        return NextResponse.json({ error: "Internal server error!" }, { status: 500 });
    }
}
