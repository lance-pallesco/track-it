/**
 * Transaction service - create, list, and aggregate transactions.
 */

import { prisma } from "@/lib/prisma"
import { TransactionType } from "@prisma/client"

export interface CreateTransactionInput {
  userId: string
  accountId: string
  toAccountId?: string
  amount: number
  type: TransactionType
  categoryId?: string
  note?: string
  date?: Date
}

export async function createTransaction(input: CreateTransactionInput) {
  const date = input.date ?? new Date()
  return prisma.transaction.create({
    data: {
      userId: input.userId,
      accountId: input.accountId,
      toAccountId: input.toAccountId,
      amount: input.amount,
      type: input.type,
      categoryId: input.categoryId,
      note: input.note,
      date,
    },
  })
}

/**
 * Create a transfer - single transaction record (from source to destination).
 * Balance logic: source account subtracts, destination (toAccount) adds.
 */
export async function createTransfer(
  userId: string,
  fromAccountId: string,
  toAccountId: string,
  amount: number,
  note?: string,
  date?: Date
) {
  return prisma.transaction.create({
    data: {
      userId,
      accountId: fromAccountId,
      toAccountId,
      amount,
      type: "TRANSFER",
      note,
      date: date ?? new Date(),
    },
  })
}

export async function getRecentTransactions(
  userId: string,
  limit = 20
) {
  return prisma.transaction.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: limit,
    include: {
      account: true,
      toAccount: true,
      category: true,
    },
  })
}

export async function getTransactionsByAccount(
  accountId: string,
  limit = 50
) {
  return prisma.transaction.findMany({
    where: {
      OR: [{ accountId }, { toAccountId: accountId }],
    },
    orderBy: { date: "desc" },
    take: limit,
    include: {
      account: true,
      toAccount: true,
      category: true,
    },
  })
}

/**
 * Aggregate totals for dashboard: total income, expenses, net.
 */
export async function getTransactionTotals(userId: string, until?: Date) {
  const where: { userId: string; date?: { lte: Date } } = { userId }
  if (until) where.date = { lte: until }

  const transactions = await prisma.transaction.findMany({ where })

  let totalIncome = 0
  let totalExpense = 0

  for (const t of transactions) {
    const amt = Number(t.amount)
    if (t.type === "INCOME") totalIncome += amt
    else if (t.type === "EXPENSE") totalExpense += amt
    else if (t.type === "TRANSFER") {
      // Transfers net to zero for net worth; don't count in income/expense
    }
  }

  return {
    totalIncome,
    totalExpense,
    netCashFlow: totalIncome - totalExpense,
  }
}
