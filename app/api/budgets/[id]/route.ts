import { NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { getBudgetById, updateBudget, deleteBudget } from "@/lib/services/budget.service"
import { updateBudgetSchema } from "@/lib/validations/budget"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const budget = await getBudgetById((await params).id, session.user.id)
  if (!budget) return NextResponse.json({ error: "Budget not found" }, { status: 404 })
  return NextResponse.json({ ...budget, amount: Number(budget.amount) })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const parsed = updateBudgetSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Validation failed" }, { status: 400 })
  if (parsed.data.amount == null) return NextResponse.json({ error: "Amount required" }, { status: 400 })
  try {
    const budget = await updateBudget(id, session.user.id, parsed.data.amount)
    return NextResponse.json({ ...budget, amount: Number(budget.amount) })
  } catch (e) {
    if (e instanceof Error && e.message === "Budget not found") return NextResponse.json({ error: "Budget not found" }, { status: 404 })
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    await deleteBudget((await params).id, session.user.id)
    return new NextResponse(null, { status: 204 })
  } catch (e) {
    if (e instanceof Error && e.message === "Budget not found") return NextResponse.json({ error: "Budget not found" }, { status: 404 })
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
