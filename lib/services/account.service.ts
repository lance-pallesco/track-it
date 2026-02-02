/**
 * Account service - CRUD, archive, and balance computation for user accounts.
 * Archived accounts cannot receive new transactions but remain visible for history.
 */

import { prisma } from "@/lib/prisma"
import type { AccountType } from "@prisma/client"

export interface CreateAccountInput {
  userId: string
  name: string
  type: AccountType
  initialAmount?: number
  currency?: string
  color?: string
}

export async function createAccount(input: CreateAccountInput) {
  return prisma.account.create({
    data: {
      userId: input.userId,
      name: input.name,
      type: input.type,
      initialAmount: input.initialAmount ?? 0,
      currency: input.currency ?? "PHP",
      color: input.color,
    },
  })
}

export interface UpdateAccountInput {
  name?: string
  type?: AccountType
  initialAmount?: number
  currency?: string
  color?: string
}

export async function updateAccount(
  accountId: string,
  userId: string,
  input: UpdateAccountInput
) {
  await assertAccountOwnership(accountId, userId)
  return prisma.account.update({
    where: { id: accountId },
    data: {
      ...(input.name != null && { name: input.name }),
      ...(input.type != null && { type: input.type }),
      ...(input.initialAmount != null && { initialAmount: input.initialAmount }),
      ...(input.currency != null && { currency: input.currency }),
      ...(input.color !== undefined && { color: input.color }),
    },
  })
}

/** Soft-delete: set status to ARCHIVED. Archived accounts cannot receive new transactions. */
export async function archiveAccount(accountId: string, userId: string) {
  await assertAccountOwnership(accountId, userId)
  return prisma.account.update({
    where: { id: accountId },
    data: { status: "ARCHIVED" },
  })
}

export async function getAccountById(accountId: string) {
  return prisma.account.findUnique({
    where: { id: accountId },
    include: {
      transactionsFrom: { orderBy: { date: "desc" }, take: 20, include: { category: true, toAccount: true } },
      transactionsTo: { orderBy: { date: "desc" }, take: 20, include: { category: true, account: true } },
    },
  })
}

/** Throws if account does not exist or does not belong to user. */
export async function assertAccountOwnership(accountId: string, userId: string) {
  const account = await prisma.account.findFirst({
    where: { id: accountId, userId },
  })
  if (!account) {
    throw new Error("Account not found")
  }
  return account
}

/** Returns true if account is ACTIVE and can receive new transactions. */
export async function isAccountActive(accountId: string): Promise<boolean> {
  const account = await prisma.account.findUnique({ where: { id: accountId } })
  if (!account) return false
  if ("status" in account && account.status) return account.status === "ACTIVE"
  return true
}

export async function getAccountsByUserId(userId: string, _includeArchived = true) {
  return prisma.account.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    include: {
      transactionsFrom: { orderBy: { date: "desc" }, take: 5 },
    },
  })
}

/**
 * Computes current balance from initialAmount + sum of transactions.
 * INCOME: +amount, EXPENSE: -amount, TRANSFER out: -amount, TRANSFER in: +amount (via toAccount).
 */
export async function getAccountBalance(
  accountId: string
): Promise<{ balance: number; currency: string }> {
  const account = await prisma.account.findUnique({
    where: { id: accountId },
    include: {
      transactionsFrom: true,
      transactionsTo: true,
    },
  })

  if (!account) {
    return { balance: 0, currency: "PHP" }
  }

  const initial = Number(account.initialAmount)
  const inflows =
    account.transactionsFrom
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + Number(t.amount), 0) +
    account.transactionsTo.reduce((sum, t) => sum + Number(t.amount), 0)
  const outflows = account.transactionsFrom
    .filter(
      (t) =>
        t.type === "EXPENSE" ||
        (t.type === "TRANSFER" && t.toAccountId)
    )
    .reduce((sum, t) => sum + Number(t.amount), 0)
  const balance = initial + inflows - outflows

  return { balance, currency: account.currency }
}

/**
 * Batch compute balances for all user accounts (all statuses for reporting).
 */
export async function getAccountsWithBalances(userId: string) {
  const accounts = await prisma.account.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    include: {
      transactionsFrom: {
        orderBy: { date: "desc" },
        take: 15,
        include: { category: true, toAccount: true },
      },
      transactionsTo: {
        orderBy: { date: "desc" },
        take: 15,
        include: { category: true, account: true },
      },
    },
  })

  const withBalances = await Promise.all(
    accounts.map(async (acc) => {
      const { balance } = await getAccountBalance(acc.id)
      const fromTx = acc.transactionsFrom.map((t) => ({ ...t, isInflow: t.type === "INCOME" }))
      const toTx = acc.transactionsTo.map((t) => ({ ...t, isInflow: true }))
      const allTx = [...fromTx, ...toTx]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10)
      return { ...acc, balance, recentTransactions: allTx }
    })
  )

  return withBalances
}
