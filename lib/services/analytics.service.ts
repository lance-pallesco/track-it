/**
 * Analytics service - computed from transactions. User-scoped, date-range aware.
 * No stored aggregates; all derived from transaction data.
 */

import { prisma } from "@/lib/prisma"
import { getAccountBalance } from "./account.service"

export interface DateRange {
  from: Date
  to: Date
}

export async function getCashFlow(userId: string, range: DateRange) {
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: { gte: range.from, lte: range.to },
    },
  })
  let income = 0
  let expense = 0
  for (const t of transactions) {
    const amt = Number(t.amount)
    if (t.type === "INCOME") income += amt
    else if (t.type === "EXPENSE") expense += amt
  }
  return { income, expense, net: income - expense }
}

export async function getExpenseBreakdownByCategory(userId: string, range: DateRange) {
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      type: "EXPENSE",
      date: { gte: range.from, lte: range.to },
    },
    include: { category: true },
  })
  const byCategory: Record<string, { name: string; total: number }> = {}
  for (const t of transactions) {
    const key = t.categoryId ?? "Uncategorized"
    const name = t.category?.name ?? "Uncategorized"
    if (!byCategory[key]) byCategory[key] = { name, total: 0 }
    byCategory[key].total += Number(t.amount)
  }
  return Object.values(byCategory).sort((a, b) => b.total - a.total)
}

export async function getMonthlySummary(userId: string, year: number) {
  const months: { month: string; income: number; expense: number; net: number }[] = []
  for (let m = 1; m <= 12; m++) {
    const monthStr = `${year}-${String(m).padStart(2, "0")}`
    const from = new Date(year, m - 1, 1)
    const to = new Date(year, m, 0)
    const flow = await getCashFlow(userId, { from, to })
    months.push({
      month: monthStr,
      income: flow.income,
      expense: flow.expense,
      net: flow.net,
    })
  }
  return months
}

export async function getYearlySummary(userId: string, years: number = 3) {
  const result: { year: number; income: number; expense: number; net: number }[] = []
  const currentYear = new Date().getFullYear()
  for (let y = currentYear - years; y <= currentYear; y++) {
    const from = new Date(y, 0, 1)
    const to = new Date(y, 11, 31)
    const flow = await getCashFlow(userId, { from, to })
    result.push({ year: y, income: flow.income, expense: flow.expense, net: flow.net })
  }
  return result
}

export async function getNetWorth(userId: string): Promise<number> {
  const accounts = await prisma.account.findMany({
    where: { userId },
  })
  let total = 0
  for (const acc of accounts) {
    const { balance } = await getAccountBalance(acc.id)
    total += balance
  }
  return total
}
