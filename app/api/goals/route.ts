import { NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { getGoalsByUserId, createGoal } from "@/lib/services/goal.service"
import { createGoalSchema } from "@/lib/validations/goal"

export async function GET() {
  const session = await getAuthSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const goals = await getGoalsByUserId(session.user.id)
  const serialized = goals.map((g) => ({
    ...g,
    targetAmount: Number(g.targetAmount),
    currentAmount: Number(g.currentAmount),
  }))
  return NextResponse.json(serialized)
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
  const parsed = createGoalSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 })
  }
  try {
    const goal = await createGoal({
      userId: session.user.id,
      name: parsed.data.name,
      targetAmount: parsed.data.targetAmount,
      currentAmount: parsed.data.currentAmount,
      currency: parsed.data.currency,
      deadline: parsed.data.deadline,
      linkedAccountId: parsed.data.linkedAccountId,
    })
    return NextResponse.json({
      ...goal,
      targetAmount: Number(goal.targetAmount),
      currentAmount: Number(goal.currentAmount),
    }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed to create goal" }, { status: 500 })
  }
}
