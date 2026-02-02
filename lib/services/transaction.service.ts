/**
 * Transaction service - create, list, update, delete. Atomic transfers.
 * Archived accounts cannot receive new transactions.
 */

import { prisma } from "@/lib/prisma"
import type { TransactionType } from "@prisma/client"
import { isAccountActive } from "./account.service"

export interface CreateTransactionInput {
  userId: string
  accountId: string
  toAccountId?: string
  amount: number
  type: TransactionType
  categoryId?: string | null
  note?: string | null
  date?: Date
  receiptMetadata?: string | null
}

/** Reject if account is archived. */
async function assertAccountActive(accountId: string) {
  const active = await isAccountActive(accountId)
  if (!active) {
    throw new Error("Cannot add transactions to an archived account")
  }
}

export async function createTransaction(input: CreateTransactionInput) {
  await assertAccountActive(input.accountId)
  if (input.type === "TRANSFER" && input.toAccountId) {
    await assertAccountActive(input.toAccountId)
  }

  const date = input.date ?? new Date()
  return prisma.transaction.create({
    data: {
      userId: input.userId,
      accountId: input.accountId,
      toAccountId: input.toAccountId ?? undefined,
      amount: input.amount,
      type: input.type,
      categoryId: input.categoryId ?? undefined,
      note: input.note ?? undefined,
      receiptMetadata: input.receiptMetadata ?? undefined,
      date,
    },
  })
}

/**
 * Create a transfer - single transaction (from source to destination).
 * Atomic: both accounts must be ACTIVE.
 */
export async function createTransfer(
  userId: string,
  fromAccountId: string,
  toAccountId: string,
  amount: number,
  note?: string,
  date?: Date
) {
  await assertAccountActive(fromAccountId)
  await assertAccountActive(toAccountId)
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

export interface ListTransactionsParams {
  userId: string
  page?: number
  pageSize?: number
  accountId?: string
  categoryId?: string
  type?: TransactionType
  fromDate?: Date
  toDate?: Date
}

export interface ListTransactionsResult {
  transactions: Awaited<ReturnType<typeof prisma.transaction.findMany>>
  total: number
  page: number
  pageSize: number
}

export async function listTransactions(params: ListTransactionsParams): Promise<ListTransactionsResult> {
  const { userId, page = 1, pageSize = 20, accountId, categoryId, type, fromDate, toDate } = params
  const where: Parameters<typeof prisma.transaction.findMany>[0]["where"] = { userId }
  if (accountId) {
    where.OR = [{ accountId }, { toAccountId: accountId }]
  }
  if (categoryId) where.categoryId = categoryId
  if (type) where.type = type
  if (fromDate || toDate) {
    where.date = {}
    if (fromDate) (where.date as { gte?: Date }).gte = fromDate
    if (toDate) (where.date as { lte?: Date }).lte = toDate
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { date: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { account: true, toAccount: true, category: true },
    }),
    prisma.transaction.count({ where }),
  ])

  return { transactions, total, page, pageSize }
}

export async function getTransactionById(id: string, userId: string) {
  const tx = await prisma.transaction.findFirst({
    where: { id, userId },
    include: { account: true, toAccount: true, category: true },
  })
  return tx
}

export interface UpdateTransactionInput {
  amount?: number
  categoryId?: string | null
  note?: string | null
  date?: Date
  receiptMetadata?: string | null
}

export async function updateTransaction(
  id: string,
  userId: string,
  input: UpdateTransactionInput
) {
  const existing = await prisma.transaction.findFirst({
    where: { id, userId },
  })
  if (!existing) throw new Error("Transaction not found")
  return prisma.transaction.update({
    where: { id },
    data: {
      ...(input.amount != null && { amount: input.amount }),
      ...(input.categoryId !== undefined && { categoryId: input.categoryId }),
      ...(input.note !== undefined && { note: input.note }),
      ...(input.date != null && { date: input.date }),
      ...(input.receiptMetadata !== undefined && { receiptMetadata: input.receiptMetadata }),
    },
  })
}

export async function deleteTransaction(id: string, userId: string) {
  const existing = await prisma.transaction.findFirst({
    where: { id, userId },
  })
  if (!existing) throw new Error("Transaction not found")
  return prisma.transaction.delete({ where: { id } })
}

export async function getRecentTransactions(userId: string, limit = 20) {
  return prisma.transaction.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: limit,
    include: { account: true, toAccount: true, category: true },
  })
}

export async function getTransactionsByAccount(accountId: string, limit = 50) {
  return prisma.transaction.findMany({
    where: {
      OR: [{ accountId }, { toAccountId: accountId }],
    },
    orderBy: { date: "desc" },
    take: limit,
    include: { account: true, toAccount: true, category: true },
  })
}

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
  }
  return {
    totalIncome,
    totalExpense,
    netCashFlow: totalIncome - totalExpense,
  }
}
