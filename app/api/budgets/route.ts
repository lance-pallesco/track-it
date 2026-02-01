import { NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { getBudgetsByUserId, createBudget, getBudgetWithUtilization } from "@/lib/services/budget.service"
import { createBudgetSchema } from "@/lib/validations/budget"

export async function GET(request: Request) {
  const session = await getAuthSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const month = new URL(request.url).searchParams.get("month") ?? undefined
  const budgets = await getBudgetsByUserId(session.user.id, month)
  const withUtil = await Promise.all(budgets.map((b) => getBudgetWithUtilization(b)))
  return NextResponse.json(withUtil.map((b) => ({ ...b, amount: Number(b.amount) })))
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
  const parsed = createBudgetSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 })
  }
  try {
    const budget = await createBudget({
      userId: session.user.id,
      categoryId: parsed.data.categoryId,
      amount: parsed.data.amount,
      month: parsed.data.month,
    })
    return NextResponse.json(budget, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}
