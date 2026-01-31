/**
 * Dashboard service - aggregates data for the overview page.
 */

import { getAccountsWithBalances } from "./account.service"
import { getRecentTransactions } from "./transaction.service"
import { getTransactionTotals } from "./transaction.service"

export async function getDashboardData(userId: string) {
  const [accounts, transactions, totals] = await Promise.all([
    getAccountsWithBalances(userId),
    getRecentTransactions(userId, 15),
    getTransactionTotals(userId),
  ])

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0)

  return {
    totalBalance,
    totalIncome: totals.totalIncome,
    totalExpense: totals.totalExpense,
    netCashFlow: totals.netCashFlow,
    accounts,
    recentTransactions: transactions,
  }
}
