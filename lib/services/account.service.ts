/**
 * Account service - CRUD and balance computation for user accounts.
 */

import { prisma } from "@/lib/prisma"
import { AccountType } from "@prisma/client"

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

export async function getAccountsByUserId(userId: string) {
  return prisma.account.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    include: {
      transactionsFrom: {
        orderBy: { date: "desc" },
        take: 5,
      },
    },
  })
}

/**
 * Computes current balance for an account from initialAmount + sum of transactions.
 * INCOME: +amount, EXPENSE: -amount, TRANSFER out: -amount, TRANSFER in: +amount (via toAccount)
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

  // Inflows: INCOME to this account, TRANSFER into this account (toAccountId = A)
  const inflows =
    account.transactionsFrom
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + Number(t.amount), 0) +
    account.transactionsTo.reduce((sum, t) => sum + Number(t.amount), 0)

  // Outflows: EXPENSE from this account, TRANSFER out (accountId = A, toAccountId set)
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
 * Batch compute balances for all user accounts.
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
      // Merge and sort recent transactions (from both directions)
      const fromTx = acc.transactionsFrom.map((t) => ({
        ...t,
        isInflow: t.type === "INCOME", // EXPENSE and TRANSFER-out are outflows
      }))
      const toTx = acc.transactionsTo.map((t) => ({
        ...t,
        isInflow: true, // We're the destination
      }))
      const allTx = [...fromTx, ...toTx]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10)
      return { ...acc, balance, recentTransactions: allTx }
    })
  )

  return withBalances
}
