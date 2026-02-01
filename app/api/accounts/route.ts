import { NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { getAccountsByUserId, createAccount } from "@/lib/services/account.service"
import { getAccountBalance } from "@/lib/services/account.service"
import { createAccountSchema } from "@/lib/validations/account"

export async function GET() {
  const session = await getAuthSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const accounts = await getAccountsByUserId(session.user.id, true)
  const withBalances = await Promise.all(
    accounts.map(async (acc) => {
      const { balance } = await getAccountBalance(acc.id)
      return {
        id: acc.id,
        userId: acc.userId,
        name: acc.name,
        type: acc.type,
        status: "status" in acc && acc.status ? acc.status : "ACTIVE",
        initialAmount: Number(acc.initialAmount),
        currency: acc.currency,
        color: acc.color,
        createdAt: acc.createdAt,
        updatedAt: acc.updatedAt,
        balance,
      }
    })
  )
  return NextResponse.json(withBalances)
}

export async function POST(request: Request) {
  const session = await getAuthSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const parsed = createAccountSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 })
  }
  const { name, type, initialAmount, currency, color } = parsed.data
  try {
    const account = await createAccount({
      userId: session.user.id,
      name,
      type,
      initialAmount,
      currency,
      color,
    })
    return NextResponse.json(account, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed to create account" }, { status: 500 })
  }
}
