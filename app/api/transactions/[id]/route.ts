import { NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import {
  getTransactionById,
  updateTransaction,
  deleteTransaction,
} from "@/lib/services/transaction.service"
import { updateTransactionSchema } from "@/lib/validations/transaction"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const tx = await getTransactionById(id, session.user.id)
  if (!tx) return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
  return NextResponse.json({ ...tx, amount: Number(tx.amount) })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const parsed = updateTransactionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 })
  }
  try {
    const tx = await updateTransaction(id, session.user.id, parsed.data)
    return NextResponse.json({ ...tx, amount: Number(tx.amount) })
  } catch (e) {
    if (e instanceof Error && e.message === "Transaction not found") {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed to update" }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  try {
    await deleteTransaction(id, session.user.id)
    return new NextResponse(null, { status: 204 })
  } catch (e) {
    if (e instanceof Error && e.message === "Transaction not found") {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed to delete" }, { status: 500 })
  }
}
