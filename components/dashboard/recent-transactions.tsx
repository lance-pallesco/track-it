"use client"

import Link from "next/link"
import { ArrowLeftRight, ArrowDownRight, ArrowUpRight } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: currency || "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date))
}

interface Transaction {
  id: string
  amount: number
  type: string
  date: Date
  note?: string | null
  account: { name: string }
  toAccount?: { name: string } | null
  category?: { name: string } | null
}

interface RecentTransactionsProps {
  transactions: Transaction[]
  currency?: string
}

export function RecentTransactions({
  transactions,
  currency = "PHP",
}: RecentTransactionsProps) {
  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your latest income, expenses, and transfers</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No transactions yet</p>
          <Link
            href="/dashboard/transactions"
            className="mt-2 text-sm text-primary hover:underline"
          >
            Add your first transaction →
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Income, expenses, and transfers</CardDescription>
        </div>
        <Link
          href="/dashboard/transactions"
          className="text-sm font-medium text-primary hover:underline"
        >
          View all
        </Link>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {transactions.map((t) => {
            const isIncome = t.type === "INCOME"
            const isTransfer = t.type === "TRANSFER"
            const isExpense = t.type === "EXPENSE"
            // INCOME = inflow (+), EXPENSE = outflow (-), TRANSFER = movement (neutral display)
            const inflow = isIncome
            const outflow = isExpense
            const isMovement = isTransfer

            return (
              <li
                key={t.id}
                className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "rounded-full p-2",
                      inflow && "bg-green-500/10",
                      outflow && "bg-red-500/10",
                      isMovement && "bg-muted"
                    )}
                  >
                    {isTransfer ? (
                      <ArrowLeftRight className="size-4 text-muted-foreground" />
                    ) : inflow ? (
                      <ArrowDownRight className="size-4 text-green-600" />
                    ) : (
                      <ArrowUpRight className="size-4 text-destructive" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">
                      {isTransfer && t.toAccount
                        ? `Transfer to ${t.toAccount.name}`
                        : t.category?.name ?? t.type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t.account.name}
                      {t.toAccount ? ` → ${t.toAccount.name}` : ""} · {formatDate(t.date)}
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    "font-semibold",
                    inflow && "text-green-600",
                    outflow && "text-destructive",
                    isMovement && "text-muted-foreground"
                  )}
                >
                  {inflow ? "+" : outflow ? "-" : ""}
                  {formatAmount(t.amount, currency)}
                </span>
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}
