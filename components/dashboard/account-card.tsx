"use client"

import { useState } from "react"
import {
  ChevronDown,
  ChevronUp,
  Maximize2,
  Wallet,
  CreditCard,
  Banknote,
  Landmark,
  PiggyBank,
  TrendingUp,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import type { AccountType } from "@prisma/client"

const ACCOUNT_ICONS: Record<AccountType, React.ElementType> = {
  CASH: Banknote,
  BANK: Landmark,
  E_WALLET: Wallet,
  CREDIT_CARD: CreditCard,
  LOAN: PiggyBank,
  INVESTMENT: TrendingUp,
}

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: currency || "PHP",
    minimumFractionDigits: 2,
  }).format(amount)
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date))
}

interface TransactionItem {
  id: string
  amount: number
  type: string
  date: Date
  note?: string | null
  category?: { name: string } | null
  toAccount?: { name: string } | null
  account?: { name: string } | null
  isInflow?: boolean
}

interface AccountCardProps {
  id: string
  name: string
  type: AccountType
  currency: string
  balance: number
  recentTransactions: TransactionItem[]
}

export function AccountCard({
  id,
  name,
  type,
  currency,
  balance,
  recentTransactions: transactions,
}: AccountCardProps) {
  const [open, setOpen] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const Icon = ACCOUNT_ICONS[type] ?? Wallet

  return (
    <>
      <Collapsible open={open} onOpenChange={setOpen}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-2">
                <Icon className="size-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">{name}</CardTitle>
                <CardDescription className="capitalize">
                  {type.replace("_", " ")}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-8">
                    <Maximize2 className="size-4" />
                    <span className="sr-only">Expand</span>
                  </Button>
                </SheetTrigger>
                <SheetContent className="sm:max-w-lg overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>{name}</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Balance</p>
                      <p
                        className={cn(
                          "text-2xl font-semibold",
                          balance >= 0 ? "text-foreground" : "text-destructive"
                        )}
                      >
                        {formatAmount(balance, currency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">Recent transactions</p>
                      {transactions.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No transactions yet
                        </p>
                      ) : (
                        <ul className="space-y-2">
                          {transactions.map((t) => (
                            <li
                              key={t.id}
                              className="flex items-center justify-between rounded-lg border p-3 text-sm"
                            >
                              <div>
                                <p>
                                  {t.type === "TRANSFER"
                                    ? t.toAccount
                                      ? `Transfer to ${t.toAccount.name}`
                                      : `Transfer from ${t.account?.name ?? "unknown"}`
                                    : t.category?.name ?? t.type}
                                </p>
                                <p className="text-muted-foreground text-xs">
                                  {formatDate(t.date)}
                                  {t.note ? ` · ${t.note}` : ""}
                                </p>
                              </div>
                              <span
                                className={cn(
                                  "font-medium",
                                  t.isInflow ? "text-green-600" : "text-destructive"
                                )}
                              >
                                {t.isInflow ? "+" : "-"}
                                {formatAmount(t.amount, currency)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                  {open ? (
                    <ChevronUp className="size-4" />
                  ) : (
                    <ChevronDown className="size-4" />
                  )}
                  <span className="sr-only">Toggle</span>
                </Button>
              </CollapsibleTrigger>
            </div>
          </CardHeader>
          <CardContent>
            <p
              className={cn(
                "text-2xl font-bold",
                balance >= 0 ? "text-foreground" : "text-destructive"
              )}
            >
              {formatAmount(balance, currency)}
            </p>
            <CollapsibleContent>
              <div className="mt-4 border-t pt-4">
                <p className="text-sm font-medium mb-2">Recent transactions</p>
                {transactions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No transactions yet
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {transactions.slice(0, 5).map((t) => (
                      <li
                        key={t.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span>
                          {t.type === "TRANSFER"
                            ? t.toAccount
                              ? `→ ${t.toAccount.name}`
                              : `← ${t.account?.name ?? "?"}`
                            : t.category?.name ?? t.type}
                        </span>
                        <span
                          className={cn(
                            "font-medium",
                            t.isInflow ? "text-green-600" : "text-destructive"
                          )}
                        >
                          {t.isInflow ? "+" : "-"}
                          {formatAmount(t.amount, currency)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CollapsibleContent>
          </CardContent>
        </Card>
      </Collapsible>
    </>
  )
}
