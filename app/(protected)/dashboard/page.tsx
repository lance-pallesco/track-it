import { getAuthSession } from "@/lib/auth"
import { getDashboardData } from "@/lib/services/dashboard.service"
import { AccountCard } from "@/components/dashboard/account-card"
import { RecentTransactions } from "@/components/dashboard/recent-transactions"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { TrendingUp, TrendingDown, Wallet, ArrowLeftRight } from "lucide-react"
import { redirect } from "next/navigation"

function formatAmount(amount: number, currency = "PHP") {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export default async function DashboardPage() {
  const session = await getAuthSession()
  if (!session) redirect("/login")

  const data = await getDashboardData(session.user.id)
  const currency = session.user.currency ?? "PHP"

  return (
    <div className="flex flex-col gap-6">
      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <Wallet className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-bold ${data.totalBalance >= 0 ? "" : "text-destructive"}`}
            >
              {formatAmount(data.totalBalance, currency)}
            </p>
            <p className="text-xs text-muted-foreground">Net worth across all accounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="size-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {formatAmount(data.totalIncome, currency)}
            </p>
            <p className="text-xs text-muted-foreground">All-time income</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="size-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">
              {formatAmount(data.totalExpense, currency)}
            </p>
            <p className="text-xs text-muted-foreground">All-time expenses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash Flow</CardTitle>
            <ArrowLeftRight className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-bold ${data.netCashFlow >= 0 ? "text-green-600" : "text-destructive"}`}
            >
              {formatAmount(data.netCashFlow, currency)}
            </p>
            <p className="text-xs text-muted-foreground">Income minus expenses</p>
          </CardContent>
        </Card>
      </div>

      {/* Account cards */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Accounts</h2>
        {data.accounts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-2">No accounts yet</p>
              <a
                href="/accounts"
                className="text-sm font-medium text-primary hover:underline"
              >
                Add your first account →
              </a>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.accounts.map((acc) => (
              <AccountCard
                key={acc.id}
                id={acc.id}
                name={acc.name}
                type={acc.type}
                currency={acc.currency}
                balance={acc.balance}
                recentTransactions={acc.recentTransactions}
              />
            ))}
          </div>
        )}
      </div>

      {/* Recent transactions */}
      <RecentTransactions
        transactions={data.recentTransactions}
        currency={currency}
      />
    </div>
  )
}
