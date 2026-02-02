import { NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { getGoalById, updateGoal, deleteGoal } from "@/lib/services/goal.service"
import { updateGoalSchema } from "@/lib/validations/goal"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const goal = await getGoalById(id, session.user.id)
  if (!goal) return NextResponse.json({ error: "Goal not found" }, { status: 404 })
  return NextResponse.json({
    ...goal,
    targetAmount: Number(goal.targetAmount),
    currentAmount: Number(goal.currentAmount),
  })
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
  const parsed = updateGoalSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 })
  }
  try {
    const goal = await updateGoal(id, session.user.id, {
      name: parsed.data.name,
      targetAmount: parsed.data.targetAmount,
      currentAmount: parsed.data.currentAmount,
      deadline: parsed.data.deadline,
      linkedAccountId: parsed.data.linkedAccountId,
      status: parsed.data.status,
    })
    return NextResponse.json({
      ...goal,
      targetAmount: Number(goal.targetAmount),
      currentAmount: Number(goal.currentAmount),
    })
  } catch (e) {
    if (e instanceof Error && e.message === "Goal not found") {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 })
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
    await deleteGoal(id, session.user.id)
    return new NextResponse(null, { status: 204 })
  } catch (e) {
    if (e instanceof Error && e.message === "Goal not found") {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 })
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed to delete" }, { status: 500 })
  }
}
