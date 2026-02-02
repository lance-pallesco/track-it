/**
 * Goals service - savings goals. Progress can be manual or synced from linked account.
 */

import { prisma } from "@/lib/prisma"
import { getAccountBalance } from "./account.service"

export interface CreateGoalInput {
  userId: string
  name: string
  targetAmount: number
  currentAmount?: number
  currency?: string
  deadline?: Date | null
  linkedAccountId?: string | null
}

export async function createGoal(input: CreateGoalInput) {
  return prisma.goal.create({
    data: {
      userId: input.userId,
      name: input.name,
      targetAmount: input.targetAmount,
      currentAmount: input.currentAmount ?? 0,
      currency: input.currency ?? "PHP",
      deadline: input.deadline ?? undefined,
      linkedAccountId: input.linkedAccountId ?? undefined,
      status: "ACTIVE",
    },
  })
}

export async function getGoalsByUserId(userId: string) {
  return prisma.goal.findMany({
    where: { userId },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: { linkedAccount: true },
  })
}

export async function getGoalById(id: string, userId: string) {
  return prisma.goal.findFirst({
    where: { id, userId },
    include: { linkedAccount: true },
  })
}

export async function updateGoal(
  id: string,
  userId: string,
  input: {
    name?: string
    targetAmount?: number
    currentAmount?: number
    deadline?: Date | null
    linkedAccountId?: string | null
    status?: "ACTIVE" | "PAUSED" | "COMPLETED"
  }
) {
  const existing = await prisma.goal.findFirst({ where: { id, userId } })
  if (!existing) throw new Error("Goal not found")
  const updates: Parameters<typeof prisma.goal.update>[0]["data"] = {}
  if (input.name != null) updates.name = input.name
  if (input.targetAmount != null) updates.targetAmount = input.targetAmount
  if (input.currentAmount != null) updates.currentAmount = input.currentAmount
  if (input.deadline !== undefined) updates.deadline = input.deadline
  if (input.linkedAccountId !== undefined) updates.linkedAccountId = input.linkedAccountId
  if (input.status != null) {
    updates.status = input.status
    if (input.status === "COMPLETED") {
      updates.currentAmount = existing.targetAmount
    }
  }
  return prisma.goal.update({ where: { id }, data: updates })
}

export async function deleteGoal(id: string, userId: string) {
  const existing = await prisma.goal.findFirst({ where: { id, userId } })
  if (!existing) throw new Error("Goal not found")
  return prisma.goal.delete({ where: { id } })
}

/**
 * Sync goal currentAmount from linked account balance (if linked).
 */
export async function syncGoalFromLinkedAccount(goalId: string, userId: string) {
  const goal = await prisma.goal.findFirst({
    where: { id: goalId, userId },
    include: { linkedAccount: true },
  })
  if (!goal || !goal.linkedAccountId) return goal
  const { balance } = await getAccountBalance(goal.linkedAccountId)
  await prisma.goal.update({
    where: { id: goalId },
    data: { currentAmount: Math.min(balance, Number(goal.targetAmount)) },
  })
  return getGoalById(goalId, userId)
}
