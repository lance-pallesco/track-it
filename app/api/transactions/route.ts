import { NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { listTransactions, createTransaction, createTransfer } from "@/lib/services/transaction.service"
import { createTransactionSchema } from "@/lib/validations/transaction"
import { listTransactionsSchema } from "@/lib/validations/transaction"

export async function GET(request: Request) {
  const session = await getAuthSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const query = {
    page: searchParams.get("page"),
    pageSize: searchParams.get("pageSize"),
    accountId: searchParams.get("accountId"),
    categoryId: searchParams.get("categoryId"),
    type: searchParams.get("type"),
    fromDate: searchParams.get("fromDate"),
    toDate: searchParams.get("toDate"),
  }
  const parsed = listTransactionsSchema.safeParse(query)
  const params = parsed.success
    ? { userId: session.user.id, ...parsed.data }
    : { userId: session.user.id, page: 1, pageSize: 20 }
  try {
    const result = await listTransactions(params)
    const transactions = result.transactions.map((t) => ({ ...t, amount: Number(t.amount) }))
    return NextResponse.json({ ...result, transactions })
  } catch {
    return NextResponse.json({ error: "Failed to list transactions" }, { status: 500 })
  }
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
  const parsed = createTransactionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 })
  }
  const { accountId, toAccountId, amount, type, categoryId, note, date, receiptMetadata } = parsed.data
  try {
    if (type === "TRANSFER" && toAccountId) {
      const tx = await createTransfer(session.user.id, accountId, toAccountId, amount, note ?? undefined, date)
      return NextResponse.json(tx, { status: 201 })
    }
    const tx = await createTransaction({
      userId: session.user.id,
      accountId,
      toAccountId: toAccountId ?? undefined,
      amount,
      type,
      categoryId: categoryId ?? undefined,
      note: note ?? undefined,
      date,
      receiptMetadata: receiptMetadata ?? undefined,
    })
    return NextResponse.json(tx, { status: 201 })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create transaction"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
