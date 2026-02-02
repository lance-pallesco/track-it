/**
 * GET: single account with balance and recent transactions.
 * PATCH: update account.
 */

import { NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import {
  getAccountById,
  updateAccount,
  assertAccountOwnership,
} from "@/lib/services/account.service"
import { getAccountBalance } from "@/lib/services/account.service"
import { updateAccountSchema } from "@/lib/validations/account"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const account = await getAccountById(id)
  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 })
  }
  if (account.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { balance } = await getAccountBalance(id)
  const fromTx = account.transactionsFrom.map((t) => ({ ...t, isInflow: t.type === "INCOME" }))
  const toTx = account.transactionsTo.map((t) => ({ ...t, isInflow: true }))
  const recentTransactions = [...fromTx, ...toTx]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 20)

  return NextResponse.json({
    ...account,
    balance,
    recentTransactions,
  })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = updateAccountSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  try {
    await assertAccountOwnership(id, session.user.id)
    const account = await updateAccount(id, session.user.id, parsed.data)
    return NextResponse.json(account)
  } catch (e) {
    if (e instanceof Error && e.message === "Account not found") {
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update" },
      { status: 500 }
    )
  }
}
