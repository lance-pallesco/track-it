import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function getAuthSession(){
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session")?.value;
    if (!sessionToken) return null

    const session = await prisma.session.findUnique({
        where: { sessionToken },
        include: { user: true },
    });

    if (!session) return null
    if (session.expires < new Date()) return null

    return session
}