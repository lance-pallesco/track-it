import { prisma } from "@/lib/prisma"

export interface CreateBudgetInput {
  userId: string
  categoryId: string
  amount: number
  month: string
}

export async function createBudget(input: CreateBudgetInput) {
  const monthStart = new Date(input.month + "-01")
  if (Number.isNaN(monthStart.getTime())) throw new Error("Invalid month (use YYYY-MM)")
  return prisma.budget.create({
    data: {
      userId: input.userId,
      categoryId: input.categoryId,
      amount: input.amount,
      month: monthStart,
    },
  })
}

export async function getBudgetsByUserId(userId: string, month?: string) {
  const where: { userId: string; month?: { gte: Date; lt: Date } } = { userId }
  if (month) {
    const monthStart = new Date(month + "-01")
    if (!Number.isNaN(monthStart.getTime())) {
      const next = new Date(monthStart)
      next.setMonth(next.getMonth() + 1)
      where.month = { gte: monthStart, lt: next }
    }
  }
  return prisma.budget.findMany({
    where,
    include: { category: true },
    orderBy: { month: "desc" },
  })
}

export async function getBudgetById(id: string, userId: string) {
  return prisma.budget.findFirst({
    where: { id, userId },
    include: { category: true },
  })
}

export async function updateBudget(id: string, userId: string, amount: number) {
  const existing = await prisma.budget.findFirst({ where: { id, userId } })
  if (!existing) throw new Error("Budget not found")
  return prisma.budget.update({ where: { id }, data: { amount } })
}

export async function deleteBudget(id: string, userId: string) {
  const existing = await prisma.budget.findFirst({ where: { id, userId } })
  if (!existing) throw new Error("Budget not found")
  return prisma.budget.delete({ where: { id } })
}

export async function getCategorySpent(userId: string, categoryId: string, month: string): Promise<number> {
  const monthStart = new Date(month + "-01")
  const nextMonth = new Date(monthStart)
  nextMonth.setMonth(nextMonth.getMonth() + 1)
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      categoryId,
      type: "EXPENSE",
      date: { gte: monthStart, lt: nextMonth },
    },
  })
  return transactions.reduce((sum, t) => sum + Number(t.amount), 0)
}

export async function getBudgetWithUtilization(budget: {
  id: string
  userId: string
  categoryId: string
  amount: unknown
  month: Date
  category: { name: string }
}) {
  const y = budget.month.getFullYear()
  const m = budget.month.getMonth() + 1
  const monthStr = `${y}-${String(m).padStart(2, "0")}`
  const spent = await getCategorySpent(budget.userId, budget.categoryId, monthStr)
  const limit = Number(budget.amount)
  const utilization = limit > 0 ? spent / limit : 0
  return {
    ...budget,
    amount: limit,
    spent,
    utilization,
    isOver: spent > limit,
  }
}
